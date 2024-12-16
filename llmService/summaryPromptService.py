from confluent_kafka import Producer, Consumer
import jsonpickle
import re
import uuid
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from pymongo import MongoClient
from bson.objectid import ObjectId

DB_NAME = 'smartmeet'
DOC_COLLECTION = 'transcript-summaries'

client = MongoClient("localhost", 27017)

col = client[DB_NAME][DOC_COLLECTION]

vertexai.init(project="assignmentdatacenterscale", location="us-central1")

model = GenerativeModel("gemini-1.5-pro-002")

consumeTopic = "llm_service.events.generate.summary"
produceTopic = "summary.generator.events.summary"

consumerConfig = {
    'bootstrap.servers': 'localhost:9092',
    'group.id':          'summary-events',
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

def getCompletePrompt(transcript):
    promptTemplate = f"""Provide the summary of the meeting based on the provided transcript.
    Transcript: {transcript}
    Summary: 
    """

    return promptTemplate

def acked(err, msg):
    if err is not None:
        print("Failed to deliver message: %s: %s" % (str(msg), str(err)))
    else:
        print("Message produced: %s" % (str(msg)))

def extractActionItem(transcriptChunk, fileId):

    response_schema = {
        "type": "STRING"
    }

    prompt = getCompletePrompt(transcriptChunk)

    # print("prompt is", prompt)

    response = model.generate_content(prompt, generation_config=GenerationConfig(
        response_mime_type="application/json", response_schema=response_schema
    ))
    
    # cleaned_response = re.sub("(NewActionItemList:)", "", re.sub(r"'", '"', re.sub(r"[```](json)?", "", response.candidates[0].text)))
    
    print("response is", response.text)

    result = col.update_one({"_id": fileId }, {'$set': {"summary": response.text}})

    print("updated the document", result)

    producer.produce(produceTopic, key=str(uuid.uuid4()), value=jsonpickle.encode({
        'fileId': fileId
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

            fileId = msg_json['fileId']
            
            print("got fileId", fileId)

            document = col.find_one({"_id": fileId })

            print("fetched document", document)

            transcript_data = document['transcript']
            # Extract the (optional) key and value, and print.
            # print("Consumed event from topic {topic}: key = {key:12} value = {value:12}".format(
            #     topic=msg.topic(), key=msg.key().decode('utf-8'), value=msg.value().decode('utf-8')))
            
            extractActionItem(transcript_data, fileId)

except KeyboardInterrupt:
    pass
finally:
    consumer.close()