# Harness SDK：从技术基础设施到银行智能体生态的演进路径

## 摘要

本文档从**前瞻视角**分析 Harness SDK 如何支撑《银行大模型本地化落地与AI转型全景规划书》的核心愿景——用 AI 代理（Agent）重构银行业务流程。我们不讨论模块对应关系，而是聚焦于：

1. **AI 代理如何成为"数字员工"**：借鉴 OpenAI Swarm 的多智能体编排理念，分析 Harness SDK 如何支撑银行各类业务场景的 Agent 实现
2. **技能驱动的工作流自动化**：从 scraper 经验出发，阐述"AI + 技能 = 可复用业务能力"的设计模式
3. **多智能体协同的技术路径**：通过 SDK-JAVA + Spring Cloud，分析 L4/L5 阶段的多智能体编排架构

---

## 一、规划书的核心愿景：业务流程重构

### 1.1 从"工具"到"数字员工"的范式跃迁

规划书五阶成熟度模型的核心演进逻辑：

```
L1 → L2 → L3 → L4 → L5
│     │     │     │     │
│     │     │     │     └── 生态组织者：跨机构协同
│     │     │     └──────── 业务驱动者：主动创造价值
│     │     └────────────── 流程协作者：嵌入核心流程
│     └──────────────────── 专业助手：场景化赋能
└────────────────────────── 被动工具：单点实验
```

**关键跃迁点**：
- **L2 → L3**：从"外挂工具"到"流程嵌入"，Agent 开始参与核心业务流程
- **L4 → L5**：从"单智能体"到"多智能体协同"，业务运转模式彻底重构

### 1.2 规划书的三大业务领域 Agent 需求

| 业务领域 | Agent 角色 | 核心能力要求 |
|---------|-----------|-------------|
| **Run（运营）** | 研发助手、制度百事通 | 代码生成、知识检索、问答 |
| **Protect（风控）** | 信贷尽调助理、支付路由 | 数据提取、推理判断、决策辅助 |
| **Grow（增长）** | 财资管理、财富领航 | 预测分析、主动触达、协同工作流 |

**关键洞察**：规划书反复强调"最后 1% 必须人工卡死"，这正是 Agent 可控性设计的核心——AI 推进流程到 99%，人类完成最终审批。

---

## 二、Harness SDK：银行智能体的技术底座

### 2.1 AI Agent 的本质架构

根据 OpenAI Swarm 的设计理念，一个 AI Agent 包含三个核心要素：

```python
Agent = {
    "instructions": "系统指令（角色定位）",
    "tools": [可调用的工具列表],
    "handoffs": [可转交的其他Agent]
}
```

Harness SDK 提供了完整的 Agent 实现能力：

```
┌─────────────────────────────────────────────────────────────────┐
│                        Harness Agent                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  系统指令        │  │  工具集          │  │  状态管理        │ │
│  │                 │  │                 │  │                 │ │
│  │  system_prompt  │  │  tools: []      │  │  session        │ │
│  │  + skill.md     │  │  + MCP tools    │  │  + memory       │ │
│  │                 │  │                 │  │                 │ │
│  │  (角色定位)      │  │  (可执行能力)    │  │  (上下文延续)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    AgentLoop (ReAct)                        ││
│  │                                                             ││
│  │  while not done:                                            ││
│  │      context = build_context(session)                       ││
│  │      response = llm.call(context, tools)                    ││
│  │      if response.needs_tools:                               ││
│  │          results = execute_tools(response.tool_calls)       ││
│  │          session.add(results)                               ││
│  │      else:                                                  ││
│  │          return response                                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 SDK-JAVA 的企业级优势

对于银行环境，SDK-JAVA 版本具有关键意义：

| 能力 | Python SDK | Java SDK + Spring Cloud |
|------|-----------|------------------------|
| **部署形态** | 脚本/服务 | 微服务集群 |
| **编排能力** | 单进程 | 分布式编排 |
| **状态管理** | 内存/文件 | 持久化 + Redis |
| **多Agent协同** | 需自建 | Spring Cloud 原生支持 |
| **生产可靠性** | 中等 | 企业级 |

**SDK-JAVA 的 AgentLoop 核心**：

```java
// AgentLoop.java - ReAct 执行引擎
public class AgentLoop {
    private final LLMClient llmClient;
    private final ToolExecutor toolExecutor;
    private final LoopConfig config;

    public LoopResult run(String prompt, Session session) {
        while (iteration < maxIterations) {
            // 1. 构建上下文
            Context context = contextBuilder.build(session);

            // 2. 调用 LLM
            LLMResponse response = llmClient.call(context, tools);

            // 3. 执行工具（如有需要）
            if (response.isToolUse()) {
                List<ToolResult> results = executeTools(response.toolCalls());
                session.addMessages(results);
                continue;
            }

            // 4. 完成
            return LoopResult.completed(response.content());
        }
    }
}
```

---

## 三、Harness Client：从 SDK 到"数字员工工作台"

### 3.1 Client 的战略定位：L2 阶段的"最后一公里"

规划书提出 L1 → L2 的关键跃迁：
> "L2（应用期 - 工具化铺开）：将验证通过的单点模型能力封装为标准的'行内内部接口（API）'，固化为全行科技研发及日常行政条线的外挂式'提效工具'。"

**Harness Client 正是这一跃迁的关键载体**：

```
┌─────────────────────────────────────────────────────────────────┐
│                     Harness Client 架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   UI Layer (PyQt6)                          │ │
│  │                                                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │ 会话管理  │  │ 对话面板  │  │ 技能面板  │  │ MCP管理   │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Controller Layer                          │ │
│  │  ChatController / MCPController / SkillController / ...    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Harness SDK                              │ │
│  │  AgentHarness / MCPManager / SkillRegistry / MemorySystem  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**核心价值**：Client 将 SDK 的 Python API 转化为银行员工可直接使用的图形界面，实现"技术能力 → 业务工具"的落地。

### 3.2 Client 的三大能力支撑规划书场景

#### 能力一：技能可视化管理 → 对应"能力货架"

规划书原文：
> "科技部化被动接单为主动输出。向各业务条线推出'能力货架'：将大模型精炼出来的'文本要素一键提取'、'规章制度防幻觉问答'作为标准数据商品上架。"

**Client 实现**：
```python
# 技能目录自动扫描
skills/
├── credit/
│   ├── due-diligence.md      # 尽调助理
│   └── risk-assessment.md    # 风险评估
├── service/
│   ├── customer-qa.md        # 客服问答
│   └── product-recommend.md  # 产品推荐

# 技能触发机制
class SkillController:
    def scan_skills(self):
        """自动扫描多个目录，形成技能货架"""
        for skill_dir in SKILL_DIRS:
            for skill_file in skill_dir.glob("*.md"):
                skill = Skill.from_file(skill_file)
                self.registry.register(skill)
```

**用户视角**：员工在右侧面板看到"技能货架"，点击即可激活，输入 `/` 可触发自动补全。

#### 能力二：MCP 服务器管理 → 对应"工具扩展能力"

规划书原文：
> "大模型自动前往已初步建好的数据中台，跨部门抽取目标企业的财务特征..."

**Client 实现**：
```
MCP 服务器配置界面：
┌─────────────────────────────────┐
│ 添加 MCP 服务器                  │
├─────────────────────────────────┤
│ 名称：data-platform             │
│ 传输方式：sse                   │
│ URL：http://内网IP:8080/sse     │
│                                 │
│ 工具列表（连接后自动发现）：       │
│ ✓ query_enterprise_data         │
│ ✓ fetch_financial_report        │
│ ✓ get_risk_indicators           │
└─────────────────────────────────┘
```

**核心能力**：
- 可视化连接/断开 MCP 服务器
- 自动发现服务器提供的工具
- 工具状态实时显示

#### 能力三：多会话管理 → 对应"工作流协同"

规划书原文：
> "理财顾问工作台边缘弹出轻量化侧边栏面板提示..."

**Client 实现**：
```python
class SessionManager:
    """会话状态管理 - 支持多任务并行"""
    
    def create(self) -> Session:
        """创建新会话（对应新任务）"""
        
    def switch_to(self, session_id: str):
        """切换会话（对应任务切换）"""
        
    def add_message_to_current(self, role: str, content: str):
        """添加消息到当前会话"""
```

**用户视角**：左侧会话列表支持多任务并行，每个会话独立上下文，可随时切换。

### 3.3 Client 的企业级部署形态

#### 银行内网部署方案

```
┌─────────────────────────────────────────────────────────────────┐
│                       银行内网环境                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  员工桌面 (Windows)                                             │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  Harness Client (EXE)                                      ││
│  │                                                            ││
│  │  配置文件：~/.harness/                                      ││
│  │  ├── settings.json    # API 配置（指向内网模型服务）          ││
│  │  ├── mcp.json         # MCP 服务器配置                      ││
│  │  └── skills/          # 技能库                              ││
│  └────────────────────────────────────────────────────────────┘│
│                              ↓ HTTPS (内网)                      │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  统一 AI 接入网关                                           ││
│  │  - 本地大模型推理服务                                        ││
│  │  - Guardrails 安全护栏                                      ││
│  │  - 审计日志                                                 ││
│  └────────────────────────────────────────────────────────────┘│
│                              ↓ MCP/SSE                           │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  MCP Server 集群                                            ││
│  │  - data-platform-server   (数据中台访问)                     ││
│  │  - regulation-server      (制度规范查询)                     ││
│  │  - crm-server             (客户关系管理)                     ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### 打包与分发

```powershell
# 打包为 Windows EXE
cd packages/client
uv run python build.py

# 输出：dist/HarnessClient.exe
# 体积：~150MB（含 Python 运行时 + PyQt6 + SDK）
```

**分发策略**：
1. 通过行内软件分发系统推送
2. 配置文件通过 AD 组策略统一管理
3. 技能库通过共享目录同步

### 3.4 Client 与规划书场景的映射

| 规划书场景 | Client 支撑能力 | 用户操作 |
|-----------|----------------|---------|
| **研发智能助手** | 技能激活 + 代码工具 + MCP 集成 | 点击"代码审查"技能 |
| **制度百事通** | 知识库 MCP 连接 + 问答界面 | 输入问题，自动检索 |
| **信贷尽调助理** | 尽调技能 + 数据中台 MCP | 选择企业名称，自动生成报告 |
| **财富领航系统** | 多会话管理 + 实时通知 | 弹出提示，一键生成建议信 |

### 3.5 Client 的演进路径

```
L1 → L2 → L3 → L4 → L5
│     │     │     │     │
│     │     │     │     └── 完整数字员工工作台
│     │     │     │         - 多 Agent 协同界面
│     │     │     │         - 实时状态监控
│     │     │     │
│     │     │     └──────── 业务工作台集成
│     │     │              - 嵌入核心系统
│     │     │              - 工作流自动化
│     │     │
│     │     └────────────── 技能货架上线
│     │                    - 可视化技能管理
│     │                    - MCP 服务器连接
│     │
│     └──────────────────── 单机工具
│                          - 基础对话能力
│                          - 本地会话管理
│
└────────────────────────── SDK 验证
                           - CLI / Python API
                           - 技术可行性验证
```

---

## 四、技能驱动：从 Scraper 到银行业务的通用模式

### 4.1 Scraper 的关键经验：AI + 技能 = 可复用业务能力

Scraper 的 IntelAgent 设计揭示了 Agent 架构的黄金法则：

**核心洞察**：
> 系统提示词（BASE_SYSTEM_PROMPT）极简，**技能文件（skill.md）驱动一切**。

```python
# agent.py
class IntelAgent:
    def __init__(self, config, skill: str | None = None):
        # 1. 极简的系统提示词
        system_prompt = BASE_SYSTEM_PROMPT  # 仅定义角色

        # 2. 从技能文件加载领域知识
        if skill:
            skill = Skill.from_file(f"{skill}.md")
            system_prompt += f"\n\n{skill.content}"

        # 3. 工具由技能文件的 tools.allowed 决定
        tools = get_tools_by_names(skill.tools.allowed)

        # 4. 创建 Agent
        self._agent = AgentHarness(
            system_prompt=system_prompt,
            tools=tools,
            ...
        )
```

**技能文件（ai-intelligence.md）的结构**：

```markdown
---
name: ai-intelligence
tools:
  allowed:
    - fetch_rss
    - fetch_hn
    - save_one_pager
---

# AI 情报提取技能

## 领域聚焦
AI/ML 行业：模型、框架、工具...

## 判断标准
必须同时满足至少 2 点：
- 概念创新：引入新术语/框架
- 采用广度：被 2+ 项目采用
- ...

## 工作流程
1. 信息收集 → 2. 初筛 → 3. 深度评估 → 4. 记录
```

### 4.2 技能驱动模式的银行应用

将 Scraper 的经验推广到银行业务场景：

| 场景 | 技能文件 | 工具集 | 领域知识 |
|------|---------|-------|---------|
| **信贷尽调** | `credit-due-diligence.md` | 数据查询、报告生成 | 尽调标准、风险指标 |
| **客服问答** | `customer-service.md` | 知识检索、工单创建 | 产品知识、话术规范 |
| **财富管理** | `wealth-advisory.md` | 市场数据、客户画像 | 投资策略、合规要求 |
| **支付路由** | `payment-routing.md` | 通道查询、决策执行 | 路由规则、成本计算 |

**示例：信贷尽调技能文件**

```markdown
---
name: credit-due-diligence
tools:
  allowed:
    - query_data_platform      # 查询数据中台
    - fetch_company_info       # 获取工商信息
    - generate_report          # 生成报告初稿
    - read_regulation          # 查阅制度规范
---

# 信贷尽调技能

## 角色定位
你是一个信贷尽调助理，负责将尽调报告推进到 99%，
最后 1% 的审批必须由信贷合规官完成。

## 核心能力
1. 自动从数据中台提取企业财务数据
2. 按照标准模板组装尽调报告初稿
3. 标注风险点供人工复核

## 权限边界
- ✅ 只读：查询数据、生成初稿
- ❌ 禁止：提交审批、修改系统数据

## 工作流程
1. 接收企业名称 → 2. 查询多源数据 → 3. 结构化整理
→ 4. 生成报告初稿 → 5. 标注待复核点 → 6. 提交人工

## 输出标准
报告必须包含：企业概况、财务分析、风险提示、建议结论
每个结论必须标注：数据来源、计算逻辑、置信度
```

### 4.3 技能注册与复用机制

SDK-JAVA 的 SkillRegistry 提供了技能管理能力：

```java
// SkillRegistry.java
public class SkillRegistry {
    private final Map<String, Skill> skills = new ConcurrentHashMap<>();

    public void register(Skill skill) {
        skills.put(skill.name(), skill);
    }

    public Skill get(String name) {
        return skills.get(name);
    }

    public List<Skill> listAll() {
        return new ArrayList<>(skills.values());
    }
}
```

**银行业务场景的技能货架**：

```
skills/
├── credit/
│   ├── due-diligence.md      # 尽调助理
│   ├── risk-assessment.md    # 风险评估
│   └── approval-routing.md   # 审批路由
├── service/
│   ├── customer-qa.md        # 客服问答
│   ├── complaint-handling.md # 投诉处理
│   └── product-recommend.md  # 产品推荐
├── wealth/
│   ├── portfolio-analysis.md # 投资组合分析
│   ├── market-monitor.md     # 市场监控
│   └── client-advisory.md    # 客户建议
└── ops/
    ├── payment-routing.md    # 支付路由
    ├── cash-forecast.md      # 现金流预测
    └── liquidity-mgmt.md     # 流动性管理
```

---

## 五、多智能体协同：通往 L4/L5 的技术路径

### 5.1 OpenAI Swarm 的编排理念

OpenAI Swarm 的核心设计：

```
┌─────────────────────────────────────────────────────────────┐
│                     Orchestrator                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Agent A ──────┐                                           │
│  (Triage)      │                                           │
│                ├───→ Agent B ────→ Agent D                  │
│                │     (Refunds)    (Complete)                 │
│                │                                           │
│                └───→ Agent C ────→ Agent D                  │
│                      (Sales)      (Complete)                 │
│                                                             │
│  Handoff: Agent 可以将任务转交给其他 Agent                   │
└─────────────────────────────────────────────────────────────┘
```

**关键机制**：
- **Routine**：定义 Agent 的标准工作流
- **Handoff**：Agent 间任务转交（通过工具函数实现）
- **Stateless**：每个 Agent 无状态，状态由 Orchestrator 管理

### 5.2 SDK-JAVA + Spring Cloud 的多智能体架构

规划书 L4/L5 阶段需要多智能体协同，SDK-JAVA 通过 Spring Cloud 提供：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Spring Cloud Orchestration Layer                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│  │ Gateway     │   │ Eureka      │   │ Config      │                   │
│  │ (路由)       │   │ (服务发现)   │   │ (配置中心)   │                   │
│  └─────────────┘   └─────────────┘   └─────────────┘                   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│  │ Agent-A     │   │ Agent-B     │   │ Agent-C     │                   │
│  │ Service     │   │ Service     │   │ Service     │                   │
│  │             │   │             │   │             │                   │
│  │ @Service    │   │ @Service    │   │ @Service    │                   │
│  │ AgentLoop   │   │ AgentLoop   │   │ AgentLoop   │                   │
│  │ Skill: X    │   │ Skill: Y    │   │ Skill: Z    │                   │
│  └─────────────┘   └─────────────┘   └─────────────┘                   │
│         │                 │                 │                          │
│         └─────────────────┼─────────────────┘                          │
│                           │                                            │
│                           ▼                                            │
│                    ┌─────────────┐                                    │
│                    │ Redis        │                                    │
│                    │ (共享状态)    │                                    │
│                    └─────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**代码示例：基于 Spring Cloud 的多 Agent 协同**

```java
@Service
public class WealthOrchestrator {

    @Autowired
    private AgentService marketMonitorAgent;

    @Autowired
    private AgentService clientAdvisorAgent;

    @Autowired
    private AgentService notificationAgent;

    @Autowired
    private RedisTemplate<String, Session> sessionStore;

    public WorkflowResult executeMarketAlert(String event) {
        // 1. 市场 Agent 检测异动
        LoopResult analysis = marketMonitorAgent.run(
            "分析市场异动：" + event
        );

        // 2. 决策 Agent 筛选客户
        LoopResult clients = clientAdvisorAgent.run(
            "筛选受影响的客户：" + analysis.content()
        );

        // 3. 通知 Agent 生成建议
        LoopResult notification = notificationAgent.run(
            "为以下客户生成通知：" + clients.content()
        );

        return WorkflowResult.completed(notification);
    }
}
```

### 5.3 规划书场景的多智能体实现

#### 场景：财富管理"投研雷达 + 客户经理领航系统"

规划书原文：
> "构建两层交织的智能化财富管理多智能体网络：
> 底层为'本地投研雷达'：全天候连续吞噬宏观新闻...
> 上层为'工作流协同领航层'：一旦雷达检测到某项市场异动..."

**Harness 实现**：

```java
// 1. 投研雷达 Agent
@Service
public class MarketRadarAgent {

    private final AgentLoop loop;

    @Scheduled(fixedRate = 60000)  // 每分钟轮询
    public void scan() {
        LoopResult result = loop.run("""
            分析最新市场动态：
            1. 检查重大新闻
            2. 计算对各标的的影响
            3. 识别风险阈值突破
            """);

        if (result.hasAlerts()) {
            eventPublisher.publish(new MarketAlertEvent(result));
        }
    }
}

// 2. 客户筛选 Agent
@Service
public class ClientFilterAgent {

    @EventListener
    public void onMarketAlert(MarketAlertEvent event) {
        LoopResult result = loop.run("""
            筛选受影响的客户：
            1. 从 CRM 查询持仓
            2. 匹配风险偏好
            3. 排序紧急程度
            """);

        // 触发通知 Agent
        notificationAgent.generateNotifications(result);
    }
}

// 3. 通知生成 Agent
@Service
public class NotificationAgent {

    public void generateNotifications(LoopResult clients) {
        for (Client client : clients.getClients()) {
            LoopResult notification = loop.run("""
                为 %s 生成调仓建议：
                1. 分析当前持仓风险
                2. 生成个性化建议信
                3. 确保合规措辞
                """.formatted(client.getName()));

            // 推送到理财顾问工作台
            advisorPortal.push(client.getAdvisorId(), notification);
        }
    }
}
```

---

## 六、安全护栏：支撑"技术硬核控险"的基石

### 6.1 规划书的安全要求

> "在网关层硬编码设立'输入动态脱敏、输出实时过滤'的双向技术防火墙"

Harness SDK 的 Guardrails 模块正是这一要求的技术实现：

```
┌─────────────────────────────────────────────────────────────┐
│                    Guardrail Pipeline                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  输入端:                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ PII 检测    │ →  │ 注入检测    │ →  │ 权限检查    │     │
│  │ (规则)      │    │ (LLM Judge) │    │ (IAM继承)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         ↓                  ↓                  ↓             │
│     [PHONE_XXX]        [RiskLevel]        [Allowed?]        │
│                                                             │
│  输出端:                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ 幻觉检测    │ →  │ 合规过滤    │ →  │ 引用溯源    │     │
│  │ (置信度)    │    │ (黑名单)    │    │ (来源验证)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Guardrails 在 Agent 流程中的位置

```java
// SDK-JAVA 的 AgentLoop 集成 Guardrails
public LoopResult executeLoop(String prompt, Session session) {
    // 1. 输入端护栏
    GuardrailResult inputCheck = guardrails.checkInput(prompt);
    if (inputCheck.isBlocked()) {
        return LoopResult.blocked("输入被拦截：" + inputCheck.reason());
    }

    // 2. 脱敏处理
    String sanitized = guardrails.sanitize(prompt);

    // 3. 正常执行
    LLMResponse response = llmClient.call(sanitized);

    // 4. 输出端护栏
    GuardrailResult outputCheck = guardrails.checkOutput(response.content());
    if (outputCheck.isBlocked()) {
        return LoopResult.blocked("输出被拦截：" + outputCheck.reason());
    }

    return LoopResult.completed(response.content());
}
```

---

## 七、演进路径：从 L1 到 L5 的技术支撑

### 7.1 各阶段的 Harness 能力需求

| 阶段 | 业务形态 | Harness 支撑能力 | SDK 需求 |
|------|---------|-----------------|---------|
| **L1** | 单点实验 | AgentHarness + 单工具 | Python SDK |
| **L2** | 场景应用 | Skill 驱动 + MCP 集成 | Python SDK |
| **L3** | 流程重构 | 多 Agent + Guardrails | SDK-JAVA |
| **L4** | 业务整合 | 多智能体编排 + Spring Cloud | SDK-JAVA + 微服务 |
| **L5** | 生态协同 | 分布式 Agent 网络 + 自优化 | 全栈 + 反馈学习 |

### 7.2 推荐实施路径

```
Phase 1 (L1-L2): 研发赋能
├── 使用 Python SDK 构建研发助手
├── 验证 Skill 驱动模式
└── 积累技能文件库

Phase 2 (L2-L3): 核心业务嵌入
├── SDK-JAVA 微服务化部署
├── Guardrails 护栏完善
├── 信贷/客服场景落地
└── IAM 权限集成

Phase 3 (L3-L4): 多智能体协同
├── Spring Cloud 编排层
├── 分布式状态管理
├── 财富管理多 Agent 场景
└── 人机协同工作流

Phase 4 (L4-L5): 自主优化
├── 反馈学习机制
├── Agent 自优化
└── 跨机构协同
```

---

## 八、与规划书核心命题的映射

### 8.1 "底层集约建设" → Harness SDK

| 规划书要求 | Harness 实现 |
|-----------|-------------|
| 统一 AI 能力接入网关 | AgentHarness 统一入口 |
| 标准 API 封装 | Tool 接口抽象 |
| 本地算力调度 | LLMClient 多 Provider 支持 |

### 8.2 "上层乐高组装" → Skill 驱动 + Harness Client

| 规划书要求 | Harness 实现 |
|-----------|-------------|
| 业务部门快速组装 | Skill 文件 + Client 可视化管理 |
| 无需算法底层代码 | 技能文件驱动工具选择 |
| 几天快速交付 | 技能注册 + Client 一键激活 |

**Client 的关键作用**：将 SDK 的 Python API 转化为图形界面，业务人员无需编程即可使用。

### 8.3 "技术硬核控险" → Guardrails

| 规划书要求 | Harness 实现 |
|-----------|-------------|
| 隐私数据动态脱敏 | PII Recognizers + Sanitization |
| 输入输出双向护栏 | GuardrailPipeline |
| 权限强制继承 | IAM 集成（需扩展） |

### 8.4 "业务三步演进" → L1-L5 路径

| 业务阶段 | Harness 支撑 | 成熟度对应 |
|---------|-------------|-----------|
| Run（运营提效） | Python SDK + Skill + Client | L1-L2 |
| Protect（流程重构） | SDK-JAVA + Guardrails + Client 企业版 | L3 |
| Grow（智能原生） | 多智能体 + Spring Cloud + 多客户端协同 | L4-L5 |

---

## 九、总结：Harness SDK 的战略价值

### 9.1 技术价值

1. **Agent 实现框架**：提供 ReAct 执行引擎、工具管理、状态管理
2. **技能驱动范式**：实现"AI + 技能 = 可复用业务能力"
3. **安全护栏体系**：支撑"技术硬核控险"的安全承诺
4. **企业级扩展**：SDK-JAVA + Spring Cloud 支撑多智能体协同
5. **桌面客户端**：Client 将 SDK 能力转化为可直接使用的图形工具

### 9.2 业务价值

1. **快速组装**：技能文件定义业务能力，Client 一键激活即用
2. **流程重构**：Agent 嵌入核心业务，推进流程到 99%
3. **风险可控**：护栏硬编码，技术一票否决
4. **生态演进**：从单 Agent 到多 Agent 协同的技术路径清晰
5. **用户友好**：图形界面降低使用门槛，业务人员可直接操作

### 9.3 关键差距与建议

| 差距项 | 现状 | 建议扩展 |
|-------|------|---------|
| IAM 权限继承 | 基础框架 | 对接行内权限系统 API |
| 多智能体编排 | 需自建 | 完善 Spring Cloud 集成模板 |
| 反馈学习 | 未实现 | 设计 Agent 效果评估与优化机制 |
| 金融合规词库 | 黑名单基础 | 扩展"保证收益"等金融专业合规词库 |

---

## 附录 A：参考资料

1. **OpenAI Swarm**：轻量级多智能体编排框架
   - 核心概念：Agent + Routine + Handoff
   - 设计理念：无状态、可观察、简洁

2. **规划书核心章节**
   - 三大硬核控险机制
   - L1-L5 五阶成熟度模型
   - Run/Protect/Grow 三大业务领域

3. **Harness 项目结构**
   - `packages/sdk/`：Python SDK
   - `packages/sdk-java/`：Java SDK
   - `packages/scraper/`：技能驱动实践

## 附录 B：关键代码索引

| 模块 | 文件路径 | 核心能力 |
|------|---------|---------|
| Agent 执行引擎 | `sdk-java/core/AgentLoop.java` | ReAct 循环 |
| 技能管理 | `sdk-java/skills/SkillRegistry.java` | 技能注册与查找 |
| 工具执行 | `sdk-java/core/ToolExecutor.java` | 工具调用管理 |
| MCP 集成 | `sdk-java/mcp/McpToolWrapper.java` | MCP 工具包装 |
| 安全护栏 | `sdk-java/security/` | 输入验证、输出过滤 |
