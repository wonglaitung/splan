# Harness 项目与规划书对应分析

## 一、总体定位

**规划书核心命题：**
> "底层集约建设、上层乐高组装、技术硬核控险、业务三步演进"

**Harness 项目定位：**
Harness SDK 是规划书中"统一AI能力接入网关"的**技术实现原型**，提供了：
- Agent 执行引擎（底层集约建设）
- MCP 工具包装机制（乐高组装）
- Guardrails 安全护栏（技术硬核控险）
- 客户端界面（业务落地载体）

---

## 二、模块与规划书章节对应

### 2.1 统一AI能力接入网关 → SDK 核心模块

| 规划书章节 | Harness 模块 | 实现状态 |
|-----------|--------------|---------|
| **隐私数据动态脱敏机制** | `guardrails/` | ✓ 已实现 |
| **IAM权限强制继承机制** | `tools/permissions.py` | ◐ 基础框架 |
| **输入/输出双向实时过滤护栏** | `guardrails/judge.py`, `stream_interceptor.py` | ✓ 已实现 |
| **智能路由引擎** | `core/agent_loop.py` | ✓ 已实现 |
| **知识库存储** | `memory/vector_store.py` | ✓ 已实现 |

### 2.2 详细对应分析

#### （1）隐私数据动态脱敏机制 → Guardrails 模块

**规划书原文：**
> "网关处的'隐私脱敏模块'会自动利用轻量级金融命名实体识别（NER）技术，识别并遮掩客户身份证、手机号、账户等敏感隐私信息（PII）。"

**Harness 实现：**

```python
# harness/guardrails/chinese_pii_recognizers.py
class ChinaMobilePhoneRecognizer     # 中国手机号识别器
class ChinaIDCardRecognizer          # 中国身份证识别器  
class ChinaBankCardRecognizer        # 中国银行卡识别器
class ChinaPassportRecognizer        # 中国护照识别器
class ChinaSocialCreditCodeRecognizer # 企业社会信用代码识别器
class ChinaLicensePlateRecognizer    # 中国车牌识别器
class HongKongPhoneRecognizer        # 香港手机号识别器
class HongKongIDCardRecognizer       # 香港身份证识别器
class ChineseNameRecognizer          # 中文姓名识别器（姓氏库）
```

**架构设计：**

```
规划书脱敏流程:
用户输入 → [NER识别层] → [敏感词匹配] → [脱敏处理] → 模型

Harness 实现:
┌─────────────────────────────────────────────────────────────┐
│                     GuardrailHook                            │
│                                                              │
│  Layer 1 (PII 规则检测):                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ UniversalPIIGuardrail                                │   │
│  │ ├── ChinaMobilePhoneRecognizer  → [PHONE_XXXX]      │   │
│  │ ├── ChinaIDCardRecognizer       → [ID_XXXX]         │   │
│  │ ├── ChinaBankCardRecognizer     → [CARD_XXXX]       │   │
│  │ ├── ChineseNameRecognizer       → [NAME_XXXX]       │   │
│  │ └── ...                                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Layer 2 (LLM Judge 语义检测):                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ComplianceJudge                                      │   │
│  │ ├── RiskLevel.LOW      → 放行                        │   │
│  │ ├── RiskLevel.MEDIUM   → 标记，人工审核              │   │
│  │ ├── RiskLevel.HIGH     → 拦截                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**关键代码：**

```python
# 使用示例
from harness.guardrails import GuardrailConfig, GuardrailHook

agent = AgentHarness(
    model="claude-sonnet-4-6",
    guardrails=GuardrailConfig(
        enabled=True,
        layer1_enabled=True,   # PII 规则检测（<1ms）
        layer2_enabled=True,   # LLM Judge 语义检测（约100ms）
        judge_endpoint="http://localhost:8001/v1/chat/completions",
    ),
)
```

#### （2）输入/输出双向实时过滤护栏 → StreamInterceptor

**规划书原文：**
> "输入端：实时拦截所有恶意推翻模型系统设定、试图套取银行内部网络机密的异常提示词攻击。"
> "输出端：内置金融专业黑白名单与合规规则库。一旦监测到模型生成的文本存在'胡言乱语'或捏造我行不存在的理财条款，在网关层直接拦截并报错。"

**Harness 实现：**

```python
# harness/guardrails/stream_interceptor.py
class StreamInterceptor:
    """
    流式输出拦截器 - 实时检测输出中的风险内容
    
    支持：
    - 实时流式拦截（不等输出完成）
    - PII 二次检测（防止模型输出敏感信息）
    - 黑名单关键词检测
    - 置信度阈值判断
    """
```

```python
# harness/guardrails/judge.py
class ComplianceJudge:
    """
    LLM Judge - 语义层面的风险评估
    
    检测：
    - Prompt 注入攻击意图
    - 越权访问意图
    - 违规金融建议
    - 敏感信息泄露风险
    """
    
    class RiskLevel:
        LOW = "low"       # 无风险，放行
        MEDIUM = "medium" # 中风险，需人工审核
        HIGH = "high"     # 高风险，拦截
        CRITICAL = "critical"  # 极高风险，立即阻断
```

#### （3）能力服务层 → SDK API 封装

**规划书原文：**
> "将全行本地算力调度、底层开源大模型能力统一封装为标准的内部接口（API）。"

**Harness 实现：**

```python
# harness/sdk/harness.py
class AgentHarness:
    """
    主入口 - 统一的 Agent API
    
    支持：
    - 多模型接入（Anthropic, OpenAI, 自定义）
    - 工具注册与管理
    - 会话与记忆管理
    - 成本控制
    - 进度追踪
    """
    
    def __init__(
        self,
        model: str = "claude-sonnet-4-6",
        provider: str = "anthropic",  # 或 "openai"
        tools: list[Tool] | None = None,
        mcp_servers: dict[str, str] | None = None,  # MCP 集成
        guardrails: GuardrailConfig | None = None,  # 安全护栏
        ...
    ):
        ...
    
    async def run(self, prompt: str) -> LoopResult:
        """执行 Agent 任务，返回结果"""
```

**多 Provider 支持：**

```python
# harness/llm/
anthropic.py   # Anthropic Claude API
openai.py      # OpenAI API（兼容第三方）
base.py        # LLMClient 接口（可扩展）
```

#### （4）乐高组装 → MCP Tool Wrapper

**规划书原文：**
> "业务部门提单时，传统IT团队无需编写复杂的算法底层代码，直接调用标准接口即可像'搭积木'一样快速组装业务应用。"

**Harness 实现：**

```python
# harness/mcp/tool_wrapper.py
class MCPToolWrapper:
    """
    MCP 工具包装器 - 将 MCP 工具转化为 Harness Tool
    
    实现：
    - MCP 工具自动注册为 Harness Tool
    - 工具名前缀 `mcp_{server}_{tool}` 避免冲突
    - JSON Schema 参数验证
    - 超时控制
    """
    
    @property
    def name(self) -> str:
        return f"mcp_{self._server_name}_{self._original_name}"
    
    async def execute(self, args: dict, ctx: ToolContext) -> ToolResult:
        """执行 MCP 工具调用"""
```

**使用示例：**

```python
# 连接内部知识库 MCP 服务
agent = AgentHarness(
    model="claude-sonnet-4-6",
    mcp_servers={
        "internal-docs": "http://10.x.x.x:8500/sse",  # Context7 MCP
    },
)

# MCP 工具自动注册为：
# - mcp_internal_docs_search_tech_manual
# - mcp_internal_docs_get_manual_chapter
```

#### （5）调度路由层 → Agent Loop

**规划书原文：**
> "智能路由引擎：按任务复杂度分发至不同规模模型"

**Harness 实现：**

```python
# harness/core/agent_loop.py
class AgentLoop:
    """
    ReAct 执行引擎 - Agent 的核心执行循环
    
    功能：
    - 工具调用编排
    - 并行工具执行支持
    - 循环检测与熔断
    - 成本控制
    - 错误处理与重试
    """
```

```python
# harness/core/circuit_breaker.py
class CircuitBreaker:
    """
    熔断器 - 防止工具循环卡死
    
    检测：
    - 同一工具连续调用超过阈值
    - 同一工具+参数组合重复调用
    """
```

---

## 三、规划书场景与 Harness 能力对应

### 3.1 Run 领域（L1/L2阶段）

#### 场景 A：研发智能助手

**规划书需求：**
> "智能助手自动扫描历史代码、自动生成重构建议、并自动输出标准的单元测试用例。"

**Harness 能力支撑：**

| 能力 | Harness 模块 | 说明 |
|------|--------------|------|
| 代码扫描 | `tools/builtins.py` → GlobTool, GrepTool | 文件搜索、代码搜索 |
| 代码读取 | `tools/builtins.py` → ReadTool | 读取文件内容 |
| 代码编辑 | `tools/builtins.py` → EditTool, WriteTool | 编辑、创建文件 |
| 命令执行 | `tools/builtins.py` → BashTool | 执行测试、构建命令 |
| 重构建议 | Agent Loop + LLM | AI 分析代码并生成建议 |

**示例：**

```python
from harness import AgentHarness
from harness.tools.builtins import ReadTool, EditTool, GlobTool, GrepTool, BashTool

agent = AgentHarness(
    model="claude-sonnet-4-6",
    tools=[ReadTool(), EditTool(), GlobTool(), GrepTool(), BashTool()],
)

result = await agent.run("""
请分析 src/legacy 目录下的老旧代码，给出重构建议：
1. 扫描所有 Python 文件
2. 分析代码结构和依赖关系
3. 输出重构建议和单元测试用例
""")
```

#### 场景 B：制度百事通

**规划书需求：**
> "构建'制度百事通'矢量知识库"

**Harness 能力支撑：**

| 能力 | Harness 模块 | 说明 |
|------|--------------|------|
| 知识库存储 | `memory/vector_store.py` | 向量存储抽象 |
| 会话管理 | `memory/session.py` | 多轮对话状态 |
| 上下文构建 | `memory/context_builder.py` | 消息窗口管理 |
| MCP 集成 | `mcp/client.py`, `mcp/tool_wrapper.py` | 连接外部知识库 |

**结合 Context7：**

```python
# Context7 提供 MCP 知识库服务
agent = AgentHarness(
    model="claude-sonnet-4-6",
    mcp_servers={
        "internal-docs": "http://10.x.x.x:8500/sse",
    },
)

# Agent 自动调用 MCP 工具查询制度
result = await agent.run("查询行内关于贷款审批的制度规定")
```

### 3.2 Protect 领域（L3阶段）

#### 场景 A：信贷尽调合稿

**规划书需求：**
> "智能工具仅拥有只读权限，负责将合稿工作流推进到 99%。最后 1% 的审批修改与系统写权限，必须卡死在人工信贷合规官手里。"

**Harness 能力支撑：**

| 能力 | Harness 模块 | 说明 |
|------|--------------|------|
| 权限控制 | `security/sandbox.py` | 命令执行权限限制 |
| 只读工具 | 自定义 Tool | 只暴露 ReadTool, GlobTool |
| 写入限制 | `security/validation.py` | 输入验证 |

**示例：**

```python
from harness.security.sandbox import LightweightSandboxConfig

# 只读模式 Agent
agent = AgentHarness(
    model="claude-sonnet-4-6",
    tools=[ReadTool(), GlobTool(), GrepTool()],  # 只暴露读取工具
    security_config=LightweightSandboxConfig(
        allowed_commands={"cat", "ls", "grep"},  # 只允许安全命令
    ),
)
```

---

## 四、技术架构对应图

### 4.1 规划书架构 vs Harness 实现

```
规划书架构                          Harness 实现
┌─────────────────────────────────────────────────────────────────────┐
│                              业务应用层                              │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│  研发助手   │  制度百事通  │  智能客服   │  信贷尽调   │  财富管理   │
│             │             │             │             │             │
│   [对应]    │   [对应]    │   [对应]    │   [对应]    │   [对应]    │
│  Client UI  │  Client UI  │  Client UI  │  Client UI  │  Client UI  │
│  + SDK      │  + MCP      │  + SDK      │  + SDK      │  + SDK      │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘
       │             │             │             │             │
       └─────────────┴──────┬──────┴─────────────┴─────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        统一AI能力接入网关                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        安全防护层                            │   │
│  │                                                              │   │
│  │  规划书:            Harness:                                 │   │
│  │  ┌─────────────┐   ┌─────────────────────────────────────┐ │   │
│  │  │隐私脱敏模块 │   │ guardrails/chinese_pii_recognizers  │ │   │
│  │  │ (NER识别)   │   │ guardrails/chinese_guardrail        │ │   │
│  │  │             │   │ guardrails/stream_interceptor       │ │   │
│  │  └─────────────┘   └─────────────────────────────────────┘ │   │
│  │                                                              │   │
│  │  规划书:            Harness:                                 │   │
│  │  ┌─────────────┐   ┌─────────────────────────────────────┐ │   │
│  │  │权限继承模块 │   │ security/sandbox                    │ │   │
│  │  │ (IAM强制)   │   │ tools/permissions                   │ │   │
│  │  │             │   │ (◐ 基础框架，需扩展)                │ │   │
│  │  └─────────────┘   └─────────────────────────────────────┘ │   │
│  │                                                              │   │
│  │  规划书:            Harness:                                 │   │
│  │  ┌─────────────┐   ┌─────────────────────────────────────┐ │   │
│  │  │双向护栏模块 │   │ guardrails/judge                    │ │   │
│  │  │ (输入/输出) │   │ guardrails/stream_interceptor       │ │   │
│  │  │             │   │ guardrails/hook                     │ │   │
│  │  └─────────────┘   └─────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        能力服务层                            │   │
│  │                                                              │   │
│  │  规划书:            Harness:                                 │   │
│  │  ┌─────────────┐   ┌─────────────────────────────────────┐ │   │
│  │  │文本生成API │   │ sdk/harness.py                       │ │   │
│  │  │问答检索API │   │ memory/vector_store                  │ │   │
│  │  │代码生成API │   │ tools/builtins                       │ │   │
│  │  └─────────────┘   │ mcp/tool_wrapper                     │ │   │
│  │                    └─────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        调度路由层                            │   │
│  │                                                              │   │
│  │  规划书:            Harness:                                 │   │
│  │  ┌─────────────┐   ┌─────────────────────────────────────┐ │   │
│  │  │智能路由引擎 │   │ core/agent_loop                      │ │   │
│  │  │             │   │ core/circuit_breaker                 │ │   │
│  │  │             │   │ core/stuck_detector                  │ │   │
│  │  │             │   │ core/step_budget                     │ │   │
│  │  └─────────────┘   └─────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          模型推理层                                  │
├─────────────────────────────────────────────────────────────────────┤
│  规划书:              Harness:                                      │
│  ┌───────────────┐   ┌───────────────────────────────────────────┐ │
│  │轻量模型(7B-14B)│   │ llm/openai.py (兼容第三方API)            │ │
│  │中等模型(32B)  │   │ llm/anthropic.py                        │ │
│  │大模型(70B+)   │   │ llm/base.py (自定义LLMClient接口)       │ │
│  │多模态(VL)     │   │                                          │ │
│  └───────────────┘   └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        基础设施层                                    │
├─────────────────────────────────────────────────────────────────────┤
│  规划书:              Harness:                                      │
│  ┌─────────────┐    ┌───────────────────────────────────────────┐  │
│  │GPU算力池    │    │ core/cost_controller (成本追踪)           │  │
│  │知识库存储   │    │ memory/vector_store                       │  │
│  │日志审计     │    │ core/observability (可观测性)             │  │
│  │监控告警     │    │ service/tracing, service/metrics          │  │
│  └─────────────┘    └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 五、待完善功能清单

基于规划书需求，Harness 需要以下扩展：

### 5.1 高优先级（L3阶段必需）

| 规划书需求 | Harness 状态 | 扩展建议 |
|-----------|--------------|----------|
| **IAM权限强制继承** | ◐ 基础框架 | 需对接行内权限系统API，实现RAG检索权限过滤 |
| **幻觉检测增强** | ✓ 已实现Judge | 需增加引用溯源验证、置信度评分阈值 |
| **合规规则库** | ◐ 黑名单检测 | 需扩展金融专业合规词库（"保证收益"、"保本保息"等） |

### 5.2 中优先级（L4阶段）

| 规划书需求 | Harness 状态 | 扩展建议 |
|-----------|--------------|----------|
| **多模型路由** | ◐ 单模型 | 需实现按任务复杂度自动选择模型 |
| **降级熔断机制** | ✓ 已实现CircuitBreaker | 需扩展为业务级降级策略 |
| **高可用部署** | ◐ 单实例 | 需扩展多实例负载均衡 |

### 5.3 低优先级（L5阶段）

| 规划书需求 | Harness 状态 | 扩展建议 |
|-----------|--------------|----------|
| **多智能体协同** | ◐ 基础框架 | 需扩展 Multi-Agent 编排 |
| **自主优化自愈** | 未实现 | 需设计反馈学习机制 |

---

## 六、总结

**Harness 项目是规划书落地的关键技术基础：**

1. **三大硬核控险机制**：Guardrails 模块已实现 PII 脱敏、双向护栏的完整框架
2. **乐高组装能力**：MCP Tool Wrapper 提供标准化工具封装，支持业务快速组装
3. **统一 API 封装**：AgentHarness 提供多模型接入、工具管理、会话管理的统一接口
4. **生产级工程能力**：Circuit Breaker、Cost Controller、Observability 提供生产可靠性保障

**关键差距：**
- IAM 权限继承需对接行内权限系统
- 多模型智能路由需扩展
- 金融合规词库需补充

**建议：**
基于 Harness SDK，扩展行内特定功能，形成银行专用版本，作为规划书中"统一AI能力接入网关"的生产实现。