# dsh-session-robustness

Production-grade session robustness: when a model request in a turn fails due to **timeout / transport / rate limit / 5xx / empty response / SSE stream closure**, instead of killing the session after the official default of "retry five times", **continue retrying until success, you cancel, or you pause**.

This is not the client sending "continue" to rerun, nor switching models. It hooks in after the official `dsh-llm-retry` and reruns the same request on the same open step.

## Why You Need It

DSH already has an official retry executor `@deepseek-ai/dsh-llm-retry`:

- Attached to the host composition (enabled in `dsh-base`)
- Policy written in each provider's `retryPolicy`
- **Default is `mode: normal`, with `maxRetries = 5`**
- Eligible codes: `EMPTY_RESPONSE` / `RATE_LIMIT` / `SERVER` / `TIMEOUT` / `TRANSPORT` (official); this plugin unconditionally adds `STREAM_CLOSED` / `MALFORMED_RESPONSE` / `STREAM` / `HTTP_408` / `HTTP_409` / `HTTP_425` / `HTTP_429` / `HTTP_499` / `HTTP_5xx`

So a TIMEOUT typically results in: UI shows "Retried model request (n/5)", after 5/5 `agent/request-error` no longer returns `{ kind: 'retry' }`, the loop treats failure as terminal, and the turn ends.

The official tool also has `retryPolicy.mode: always` (unlimited retries, including AUTH/QUOTA). This plugin **does not take that path**: permanent errors won't be fixed by waiting, and infinite retries will hang the session and burn money. This plugin only covers transient API failures.

## Behavior

```
adapter stream failure
  → agent/request-error waterfall
    → compaction (only handles CONTEXT_WINDOW_EXCEEDED)
    → dsh-llm-retry (normal: eligible codes up to 5 times)
    → this plugin (continues retrying transient failures after official budget is exhausted)
```

- Each retry reruns on the **same open turn / same step**, failed chunks do not enter model-visible history
- Backoff: exponential + jitter; provider's `Retry-After` takes priority within limits
- User clicks Stop / cancels turn: immediate stop
- Settings page can pause / disable without uninstalling
- Parent session and in-process child agents share the `agent/request-error` waterfall on host, both get intercepted. Out-of-process / ACP child agents do not.

Never retry: `AUTH`, `MISSING_CREDENTIAL`, `INVALID_CREDENTIAL`, `QUOTA`, `CONTEXT_WINDOW_EXCEEDED`, `NO_ADAPTER`, `ABORTED`. Context overflow is still handled by official compaction. User Stop is never retried.

Since 0.1.3, **all network failures that reach `agent/request-error` are unconditionally retried**, no longer relying on text: SSE peer closed (`STREAM_CLOSED`, e.g., `ended without [DONE]`), partial JSON (`MALFORMED_RESPONSE`), Responses unrecognized stream failure (`STREAM`), HTTP 408/409/425/429/499/5xx. Since 0.1.5, also includes `stream_read_error` passed through natively by the adapter, and gateway wording `Upstream request failed` (pi-ai often maps to `PI_AI_ERROR`). `PI_AI_ERROR` / `UNKNOWN` / unknown codes still use text heuristics (Codex overloaded, Upstream request failed, etc.). `HTTP_400` / `INVALID_REQUEST` / `CONTENT_FILTER` still not retried.

Failures that cannot enter the waterfall cannot be intercepted by this plugin: `prepareCall` throws, titles/summaries using `ctx.llm.stream()`, tool call failures.

Since 0.1.6, **for openai-codex only**: after a stream failure, drop the session's WebSocket continuation (`previous_response_id`). pi-ai's `websocket-cached` / `auto` treats `response.id` from a failed stream as a continuation anchor, so even after the API recovers it stays stuck on that incomplete response. The official 5 retries also clear it (observe `llm/stream`, no retries within the stream). Successful turns keep their continuation; server-side prompt cache and session history are unaffected. Other providers are untouched.

### Why Cover Codex Overloaded Too

`openai-codex` goes through pi-ai. Upstream SSE events `error` / `response.failed` become:

`Codex error: Our servers are currently overloaded. Please try again later.`

pi-ai's `classifyPiAiError()` only recognizes HTTP status codes and a few keywords, **does not recognize `overloaded`**, so the failure code falls back to `PI_AI_ERROR`. The official `dsh-llm-retry` only retries those 5 standard codes, and this plugin originally only looked at the code table, so this transient failure would directly become "run failed this turn".

Since 0.1.2: `PI_AI_ERROR` / `UNKNOWN` where the message clearly indicates a transient failure (overloaded, try again later, service unavailable, etc.) will also continue retrying. AUTH / QUOTA and other permanent codes still take priority, even if the text mentions "try again".

## Installation

```bash
dsh plugin --profile web add dsh-session-robustness
```

Or from GitHub:

```bash
dsh plugin --profile web add github:bainianlaoyao/dsh-session-robustness
```

The package declares `dsh.bundle.patch` + `dsh.client`. After installation, restart the web profile; the **Session Robustness** settings section will appear.

Local development (this repository):

```bash
dsh plugin --profile web add /home/threaded/projects/DSH-Session-Robustness/dsh-session-robustness
```

## Usage

1. Open **Settings → Session Robustness**
2. Enabled by default, retry limit 0 (unlimited)
3. While the official retry is still running, chat shows "Retried model request (n/5)" — this plugin hasn't taken over yet
4. After 5/5, above the composer you'll see "Official 5 retries exhausted, taking over for attempt N", can pause immediately
5. When you need a hard cap, change "Retry Limit" to a positive integer (this is the **additional attempts after the official 5**)

You can also write directly to `$DSH_HOME/settings.yaml`:

```yaml
session-robustness:
  enabled: true
  paused: false
  maxRetries: 0          # 0 = unlimited (after official 5 retries)
  initialDelayMs: 1000
  maxDelayMs: 30000
  jitterRatio: 0.2
  extraRetryableCodes: [] # e.g., INVALID_REQUEST; permanent errors still rejected
```

## What It Is Not

- Not `dsh-client-auto-retry`: that one automatically sends "continue" after a turn **has ended**
- Not `retryPolicy.mode: always`: that one retries AUTH/QUOTA
- Not modifying official npm packages: upgrades won't overwrite
- Does not wrap `ctx.llm.stream()`: original streams cannot persistently distinguish sent chunks

## Uninstallation

```bash
dsh plugin --profile web remove dsh-session-robustness
```

The `session-robustness` section in settings will remain in `$DSH_HOME/settings.yaml`; manually delete it if no longer needed.

## Development and Testing

```bash
npm test   # Static smoke test: waterfall takeover, never-retry codes, HTTP JSON bridge
```

## Related Plugins

Other dsh plugins by the same author, all listed in the [dsh plugin marketplace](https://awesome-dsh-plugin.com/):

- [`dsh-codex-mode`](https://github.com/bainianlaoyao/dsh-codex-harness) — Codex-style encoding presets for GPT-family models: `exec_command` / `write_stdin` / `apply_patch` / `view_image`, both OpenAI Chat Completions and Responses routes, plus graphical subagent types.
- [`dsh-llm-api-pool`](https://github.com/bainianlaoyao/dsh-llm-api-pool) — Aggregate multiple OpenAI-compatible API keys with automatic switching based on balance.
- [`dsh-bash-on-windows`](https://github.com/bainianlaoyao/bash-on-windows) — Make Git Bash the one and only true terminal tool on Windows.
- [`dsh-easy-archive`](https://github.com/bainianlaoyao/easy-archive) — Two-step inline session archiving from workspace sidebar.

## License

MIT
