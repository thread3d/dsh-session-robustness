# dsh-session-robustness Requirements

## Overview

This plugin provides production-grade session robustness by continuing to retry transient API failures after the official DSH retry budget is exhausted.

## Functional Requirements

### RF-001: Transient Failure Retry
The plugin MUST retry transient API failures that reach the `agent/request-error` event after official retries are exhausted.

**Retryable Failure Codes:**
- `TIMEOUT` - Request timeout
- `TRANSPORT` - Transport/connection failures
- `RATE_LIMIT` - HTTP 429 rate limiting
- `SERVER` - HTTP 5xx server errors
- `EMPTY_RESPONSE` - Empty/SSE closed responses
- `STREAM_CLOSED` - SSE stream closed without [DONE]
- `MALFORMED_RESPONSE` - Malformed SSE/JSON responses
- `STREAM` - Unidentified stream failures
- `STREAM_READ_ERROR` / `STREAM_READ` - Adapter stream read failures
- HTTP 408, 409, 425, 429, 499, 5xx status codes
- `PI_AI_ERROR` / `UNKNOWN` with transient message patterns

**Transient Message Patterns:**
- "overloaded", "try again later", "please try again"
- "service unavailable", "temporarily unavailable"
- "server error", "internal error", "too many requests"
- "upstream connect", "upstream request", "upstream fail"
- "bad gateway", "gateway timeout"
- "stream read", "read error", "connection refused"
- "websocket", "ECONN", "ENOTFOUND", "EAI_AGAIN"
- "socket hang up", "premature close", "other side closed"
- "HTTP2 request did not get a response", "fetch failed"
- "network error", "connection error", "connection lost"
- "connection reset", "timed out", "timeout", "terminated"
- "ResourceExhausted", "provider returned error"

### RF-002: Never Retry Permanent Failures
The plugin MUST NOT retry these failure types:
- `AUTH` - Authentication failures
- `MISSING_CREDENTIAL` - Missing credentials
- `INVALID_CREDENTIAL` / `INVALID_CREDENTIAL_CODE` - Invalid credentials
- `QUOTA` - Quota/budget exhaustion
- `CONTEXT_WINDOW_EXCEEDED` - Context length exceeded
- `NO_ADAPTER` - No adapter available
- `ABORTED` - User-initiated cancellation

### RF-003: Retry Backoff Strategy
The plugin MUST implement exponential backoff with jitter:

**Default Configuration:**
- `initialDelayMs`: 1000ms (1 second)
- `maxDelayMs`: 30000ms (30 seconds)
- `jitterRatio`: 0.2 (±20% variance)

**Retry Formula:**
```
delay = min(
  (initialDelayMs × 2^retry_count) × (1 - jitter + 2 × jitter × random(0, 1)),
  maxDelayMs
)
```

**Provider Retry-After:**
- If provider's `Retry-After` header provides a delay within limits, use it
- Otherwise, use calculated exponential backoff

### RF-004: Retry Limits
The plugin MUST support configurable retry limits:

- `maxRetries: 0` - Unlimited retries (default)
- `maxRetries: N` (N > 0) - Maximum N additional retries after official 5
- User must be able to pause/disable without uninstalling

### RF-005: Codex WebSocket Cleanup
For `openai-codex` provider only:
- On stream failure, drop the WebSocket continuation (`previous_response_id`)
- This prevents retry attempts from using incomplete response IDs
- Affects both official 5 retries and plugin retries
- Successful streams keep their continuation
- Affects pi-ai's `websocket-cached` / `auto` modes

### RF-006: Integration Point
The plugin MUST hook into the `agent/request-error` waterfall AFTER the official `@deepseek-ai/dsh-llm-retry` executor.

**Behavior:**
- Official retry runs first (normal mode: max 5 retries)
- This plugin takes over only after official budget is exhausted
- Each retry reruns the same open step with same history
- Failed chunks don't enter model-visible history

### RF-007: User Controls
The plugin MUST provide UI controls accessible via:
- Settings page: **Settings → Session Robustness**
- API endpoint: `/session-robustness/api/*`

**Available Controls:**
- Enable/disable
- Pause/resume (aborts in-flight backoffs when paused)
- Configure `maxRetries`
- Configure `initialDelayMs`, `maxDelayMs`, `jitterRatio`
- Configure `extraRetryableCodes`

### RF-008: User Feedback
The plugin MUST provide visible feedback during retries:

**In Composer:**
- Display: "Official 5 retries exhausted, taking over for attempt N"
- Show current failure code
- Show remaining wait time
- Provide "Pause Takeover" button

**In Settings:**
- Show current configuration
- Show active/retrying sessions
- Show status: Running, Paused, or Disabled

## Non-Functional Requirements

### NFR-001: Performance
- Backoff calculation must complete within 1ms
- Settings updates must be live (no restart required)
- UI polling interval: 1.5 seconds for status updates

### NFR-002: Resource Management
- Cancel all in-flight retries on session close/abort
- Clean up state on session disposal
- No memory leaks from long-running sessions

### NFR-003: Compatibility
- Works with in-process child agents
- Works with parent sessions
- Does NOT affect out-of-process / ACP child agents

### NFR-004: Configuration Persistence
- All settings persisted to `$DSH_HOME/settings.yaml` under `session-robustness` key
- Settings survive plugin restarts
- Defaults applied if settings absent:
  ```yaml
  session-robustness:
    enabled: true
    paused: false
    maxRetries: 0
    initialDelayMs: 1000
    maxDelayMs: 30000
    jitterRatio: 0.2
    extraRetryableCodes: []
  ```

## API Specification

### GET /session-robustness/api/status
Returns current status:
```json
{
  "ok": true,
  "version": "0.1.6",
  "config": {
    "enabled": true,
    "paused": false,
    "retryableCodes": [...],
    "extraRetryableCodes": [],
    "initialDelayMs": 1000,
    "maxDelayMs": 30000,
    "jitterRatio": 0.2,
    "maxRetries": 0
  },
  "neverRetry": ["AUTH", "QUOTA", ...],
  "active": [
    {
      "sessionId": "...",
      "turn": 1,
      "step": "step-abc",
      "provider": "openai-codex",
      "code": "TIMEOUT",
      "message": "...",
      "attempt": 3,
      "delayMs": 8000,
      "startedAt": 1234567890,
      "nextAt": 1234567898,
      "waiting": true,
      "codexDrop": {...}
    }
  ]
}
```

### POST /session-robustness/api/status
Same as GET (for API consistency)

### POST /session-robustness/api/update
Update configuration:
```json
{
  "extraRetryableCodes": ["INVALID_REQUEST"],
  "initialDelayMs": 2000,
  "maxDelayMs": 60000,
  "jitterRatio": 0.3,
  "maxRetries": 10
}
```

### POST /session-robustness/api/pause
Pause all retries immediately:
```json
{
  "ok": true,
  "config": {...},
  "note": "paused; in-flight backoff aborted, later failures are no longer retried until resume."
}
```

### POST /session-robustness/api/resume
Resume retries:
```json
{
  "ok": true,
  "config": {...}
}
```

## Version History

### 0.1.6
- Codex WebSocket cleanup on stream failure
- Affects both official 5 and plugin retries
- Only for `openai-codex` provider

### 0.1.5
- Retry `stream_read_error` / `STREAM_READ_ERROR`
- Retry `Upstream request failed` gateway wording
- Heuristic matching on unknown codes

### 0.1.4
- Settings page UI
- Live status display
- Configuration persistence

### 0.1.3
- Unconditional retry for network codes
- Stream failure retry

### 0.1.2
- Transient message heuristic for `PI_AI_ERROR` / `UNKNOWN`

### 0.1.0
- Initial release
