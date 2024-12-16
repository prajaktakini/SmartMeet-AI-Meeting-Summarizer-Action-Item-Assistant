package com.generator.summary.service;

import com.generator.summary.config.JiraConfig;
import com.generator.summary.constants.JiraKeys;
import com.generator.summary.constants.JiraMapping;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class JiraService {

    private final JiraConfig jiraConfig;

    private final RestTemplate restTemplate;

    public static String DEFAULT_PROJECT_ID = "10000";
    private static String DEFAULT_REPORTER_ID = "712020:5ff16db6-863b-4672-a6bb-635a5a4bb490";

    public JiraService(JiraConfig jiraConfig, RestTemplate restTemplate) {
        this.jiraConfig = jiraConfig;
        this.restTemplate = restTemplate;
    }

    public String createJiraTicket(String summary, String description, String issueId, String assigneeId, String issuePriority) {
        String url = jiraConfig.getUrl() + "/rest/api/3/issue";

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(jiraConfig.getUsername(), jiraConfig.getApiToken());
        headers.set("Content-Type", "application/json");

        Map<String, Object> requestBody = getRequestBody(summary, description, issueId, assigneeId, issuePriority);

        log.info("Jira request body: {}", requestBody);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
        log.info("Jira request entity: {}", requestEntity);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
        return response.getBody();
    }

    private Map<String, Object> getRequestBody(String summary, String desc, String issueId, String assigneeId, String issuePriority) {
        log.info("summary: {}, desc {}, issueId {}, assigneeId {}, issuePriority{}", summary, desc, issueId, assigneeId, issuePriority);
        // Define the request body
        Map<String, Object> requestBody = new HashMap<>();

        Map<String, Object> fields = new HashMap<>();
        fields.put(JiraKeys.FIELD_SUMMARY, summary);

        Map<String, String> project = new HashMap<>();
        project.put(JiraKeys.FIELD_ID, DEFAULT_PROJECT_ID);
        fields.put(JiraKeys.FIELD_PROJECT, project);

        Map<String, String> issueType = new HashMap<>();
        issueType.put(JiraKeys.FIELD_ID, issueId);
        fields.put(JiraKeys.FIELD_ISSUE_TYPE, issueType);

        // Description field as a complex structure
        Map<String, Object> description = new HashMap<>();
        description.put(JiraKeys.ISSUE_VERSION, 1);
        description.put("type", "doc");

        Map<String, Object> paragraph = new HashMap<>();
        paragraph.put("type", "paragraph");

        Map<String, String> textContent = new HashMap<>();
        textContent.put("type", "text");
        textContent.put("text", desc);

        paragraph.put("content", new Object[]{textContent});
        description.put("content", new Object[]{paragraph});
        fields.put(JiraKeys.FIELD_DESCRIPTION, description);

        // Assignee
        Map<String, String> assignee = new HashMap<>();
        assignee.put(JiraKeys.FIELD_ID, assigneeId);
        fields.put("assignee", assignee);

        // Priority
        Map<String, String> priority = new HashMap<>();
        priority.put(JiraKeys.FIELD_ID, JiraMapping.getPriorityValue(issuePriority));
        priority.put("name", issuePriority);
        priority.put("iconUrl", JiraMapping.getPriorityIconUrl(issuePriority));
        fields.put("priority", priority);

        // Reporter
        Map<String, String> reporter = new HashMap<>();
        reporter.put(JiraKeys.FIELD_ID, DEFAULT_REPORTER_ID);
        fields.put("reporter", reporter);

        fields.put("labels", new String[]{});
        fields.put("customfield_10021", new String[]{});

        requestBody.put("fields", fields);
        requestBody.put("update", new HashMap<>());
        requestBody.put("watchers", new String[]{});
        //requestBody.put("externalToken", "0.5996048452798277");

        return requestBody;
    }

    public String getJiraBaseUrl() {
        return jiraConfig.getUrl();
    }
}

