from confluent_kafka import Producer, Consumer
import jsonpickle
import re
import uuid
import vertexai
from vertexai.generative_models import GenerativeModel, ChatSession, GenerationConfig
from pymongo import MongoClient
from bson.objectid import ObjectId

DB_NAME = 'smartmeet'
DOC_COLLECTION = 'action-items'

client = MongoClient("localhost", 27017)

col = client[DB_NAME][DOC_COLLECTION]

vertexai.init(project="assignmentdatacenterscale", location="us-central1")

model = GenerativeModel("gemini-1.5-flash-002")

consumeTopic = "llm_service.events.generate.action.items"
produceTopic = "summary.generator.events.action.items"

consumerConfig = {
    'bootstrap.servers': 'localhost:9092',
    'group.id':          'kafka-python-getting-started',
    'auto.offset.reset': 'earliest'
}

producerConfig = {
    'bootstrap.servers': 'localhost:9092',
    'acks': 'all'
}

# Create Consumer instance
consumer = Consumer(consumerConfig)

producer = Producer(producerConfig)

consumer.subscribe([consumeTopic])

def getCompletePrompt(actionItemList, transcript):
    promptTemplate = f"""Give a list of action items from the given Transcript. The list should not include an action item if PrevActionItemList contains an item with similar Description. The list should be in the same format as ActionItemList and follow the given Constraints.
    ActionItemList: {[{"issueType": "type of task", "assignee": "Name of the person assigned the task", "priority": "Priority of task", "description": "Description of task", "summary": "Title of the Task"}]}
    Contraints: issueType can be one of [Task, Epic, Subtask, Story, Bug] and priority can be one of [Highest, High, Medium, Low, Lowest]
    PrevActionItemList: {actionItemList}
    Transcript: {transcript}
    NewActionItemList: 
    """

    return promptTemplate

def acked(err, msg):
    if err is not None:
        print("Failed to deliver message: %s: %s" % (str(msg), str(err)))
    else:
        print("Message produced: %s" % (str(msg)))

def extractActionItem(transcriptChunk, previousActionItems, id, fileId):

    response_schema = {
        "type": "ARRAY",
        "items": {
            "type": "OBJECT",
            "properties": {
                "issueType": {"type": "STRING"},
                "assignee": {"type": "STRING"},
                "priority": {"type": "STRING"},
                "description": {"type": "STRING"},
                "summary": {"type": "STRING"}
            },
        },
    }

    prompt = getCompletePrompt(previousActionItems, transcriptChunk)

    # print("prompt is", prompt)

    response = model.generate_content(prompt, generation_config=GenerationConfig(
        response_mime_type="application/json", response_schema=response_schema
    ))
    
    # cleaned_response = re.sub("(NewActionItemList:)", "", re.sub(r"'", '"', re.sub(r"[```](json)?", "", response.candidates[0].text)))
    
    print("response is", response.text)

    result = col.update_one({"_id": ObjectId(id) }, {'$set': {"actionItems": response.text}})

    print("updated the document", result)

    producer.produce(produceTopic, key=str(uuid.uuid4()), value=jsonpickle.encode({
        'fileId': fileId,
        'chunkId': id
    }), callback=acked)

    producer.poll(1)

# Poll for new messages from Kafka and print them.
try:
    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            # Initial message consumption may take up to
            # `session.timeout.ms` for the consumer group to
            # rebalance and start consuming
            print("Waiting...")
        elif msg.error():
            print("ERROR: %s".format(msg.error()))
        else:
            print("raw message", msg)

            msg_json = jsonpickle.decode(msg.value())

            print("msg_json is", msg_json)

            transcript_data = msg_json['chunk']
            prevId = msg_json['prevId']
            currentId = msg_json['chunkId']
            fileId = msg_json['fileId']
            
            print("got prevId", prevId)

            prevActionList = []
            #fetch prev 
            prevDocument = col.find_one({"_id": ObjectId(prevId) })

            print("fetched prevDocument", prevDocument)

            if prevDocument is not None:
                prevActionList  = prevDocument['actionItems']

                print("got prevActionItems", prevActionList)
            # Extract the (optional) key and value, and print.
            # print("Consumed event from topic {topic}: key = {key:12} value = {value:12}".format(
            #     topic=msg.topic(), key=msg.key().decode('utf-8'), value=msg.value().decode('utf-8')))
            
            extractActionItem(transcript_data, prevActionList, currentId, fileId)

except KeyboardInterrupt:
    pass
finally:
    consumer.close()