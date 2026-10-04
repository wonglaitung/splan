# 实验设计模板（Experiment Design Template）

> 用途：AB 测试 / 灰度发布前的实验设计记录，确保“每次只改一项 + 统计显著判定”。

## 基本信息

| 字段 | 填写 |
| ----- | ----- |
| 实验编号 | EXP-001 |
| 目标假设（H1） | |
| 原假设（H0） | |
| 变更项（唯一变量） | |
| 冻结项（不得改动） | |
| 涉及模型/版本 | |

## 指标与阈值

| 指标 | 口径 | 判定阈值 |
| ----- | ----- | ----- |
| 主指标（如正确率） | | 提升 ≥ 2% 且 p < 0.05 |
| 护栏指标（如延迟） | | 不得劣化 > 5% |
| 安全指标（PII/红队） | | 不得回退 |

## 样本量计算

```python
# 功效分析示例：alpha=0.05, power=0.8, 最小效应=2%
from statsmodels.stats.power import NormalIndPower
n = NormalIndPower().solve_power(
    effect_size=0.02 / 0.10,  # 效应量 = 最小效应 / 标准差（按实际替代）
    alpha=0.05, power=0.8, alternative="two-sided"
)
print(int(n), "per group")
```

## 灰度分档

| 档位 | 流量比例 | 观察时长 | 通过条件 |
| ----- | ----- | ----- | ----- |
| 1 | 5% | ≥ 24h | 主指标不劣化 |
| 2 | 25% | ≥ 24h | 主指标不劣化 |
| 3 | 100% | ≥ 24h | 显著性检验通过 |

## 显著性检验

```python
from scipy import stats
# control = [...], treatment = [...]
t, p = stats.ttest_ind(treatment, control, equal_var=False)
print(f"p = {p:.4f}")
# 判定：p < 0.05 且方向一致 → 全量；否则回滚
```

## 结论

- [ ] 全量发布
- [ ] 回滚（原因：____________）

## 签字

数据科学家：____________ 业务方：____________