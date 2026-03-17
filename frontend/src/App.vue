<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const defaultApiBase = `${window.location.protocol}//${window.location.hostname}:3000/api`;
const API_BASE = import.meta.env.VITE_API_BASE || defaultApiBase;
const token = ref(localStorage.getItem('longroot_token') || '');
const currentUser = ref(safeParse(localStorage.getItem('longroot_user')));
const loginLoading = ref(false);
const projectLoading = ref(false);
const syncLoading = ref(false);
const saveLoading = ref(false);
const detailLoading = ref(false);
const editLoading = ref(false);
const editDialogVisible = ref(false);
const selectedProjectId = ref(null);
const projects = ref([]);
const projectDetail = ref(null);
const projectSignals = ref([]);
const projectIndicators = ref([]);

const loginForm = reactive({
  username: 'admin',
  password: 'Admin123456'
});

const projectForm = reactive(defaultProjectForm());
const editForm = reactive(defaultProjectForm());

const metrics = computed(() => {
  const list = projects.value;
  return {
    total: list.length,
    enabled: list.filter((item) => Number(item.status) === 1).length,
    invested: sum(list, 'total_invested'),
    value: sum(list, 'position_value')
  };
});

const selectedSignal = computed(() => {
  if (!projectSignals.value.length) return null;
  return projectSignals.value[0];
});

const selectedIndicator = computed(() => {
  if (!projectIndicators.value.length) return null;
  return projectIndicators.value[0];
});

const canOperate = computed(() => Boolean(token.value));

function defaultProjectForm() {
  return {
    symbol: 'BTCUSDT',
    period: 'H',
    buyAmountPerOrder: 100,
    takeProfitMultiple: 2,
    sellDivisor: 4,
    status: 1
  };
}

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function sum(list, key) {
  return list.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function money(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function formatTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function signalType(action) {
  if (action === 'BUY') return 'success';
  if (action === 'SELL') return 'danger';
  return 'info';
}

function signalClass(action) {
  if (action === 'BUY') return 'signal-buy';
  if (action === 'SELL') return 'signal-sell';
  return 'signal-hold';
}

function statusText(value) {
  return Number(value) === 1 ? '启用' : '停用';
}

function applyProjectForm(target, source) {
  target.symbol = source.symbol || 'BTCUSDT';
  target.period = source.period || 'H';
  target.buyAmountPerOrder = Number(source.buy_amount_per_order ?? source.buyAmountPerOrder ?? 0);
  target.takeProfitMultiple = Number(source.take_profit_multiple ?? source.takeProfitMultiple ?? 0);
  target.sellDivisor = Number(source.sell_divisor ?? source.sellDivisor ?? 1);
  target.status = Number(source.status ?? 1);
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token.value) {
    headers.Authorization = `Bearer ${token.value}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) logout(false);
    throw new Error(data.message || `请求失败: ${response.status}`);
  }

  return data;
}

async function handleLogin() {
  loginLoading.value = true;
  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginForm)
    });
    token.value = data.token;
    currentUser.value = data.user;
    localStorage.setItem('longroot_token', data.token);
    localStorage.setItem('longroot_user', JSON.stringify(data.user));
    ElMessage.success('登录成功');
    await loadProjects();
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    loginLoading.value = false;
  }
}

function logout(showMessage = true) {
  token.value = '';
  currentUser.value = null;
  projects.value = [];
  projectDetail.value = null;
  projectSignals.value = [];
  projectIndicators.value = [];
  selectedProjectId.value = null;
  editDialogVisible.value = false;
  localStorage.removeItem('longroot_token');
  localStorage.removeItem('longroot_user');
  if (showMessage) ElMessage.success('已退出登录');
}

async function loadProjects(selectFirst = true) {
  if (!canOperate.value) return;

  projectLoading.value = true;
  try {
    const data = await request('/projects');
    projects.value = data;

    const targetId = selectedProjectId.value && data.some((item) => item.id === selectedProjectId.value)
      ? selectedProjectId.value
      : (selectFirst ? data[0]?.id : null);

    if (targetId) {
      await selectProject(targetId);
    } else {
      projectDetail.value = null;
      projectSignals.value = [];
      projectIndicators.value = [];
      selectedProjectId.value = null;
    }
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    projectLoading.value = false;
  }
}

async function selectProject(id) {
  if (!id) return;
  detailLoading.value = true;
  try {
    selectedProjectId.value = id;
    const [detail, signals, indicators] = await Promise.all([
      request(`/projects/${id}`),
      request(`/projects/${id}/signals?limit=20`),
      request(`/projects/${id}/indicators?limit=20`)
    ]);
    projectDetail.value = detail;
    projectSignals.value = signals;
    projectIndicators.value = indicators;
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    detailLoading.value = false;
  }
}

async function createProject() {
  saveLoading.value = true;
  try {
    await request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectForm)
    });
    applyProjectForm(projectForm, defaultProjectForm());
    ElMessage.success('项目已创建');
    await loadProjects();
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    saveLoading.value = false;
  }
}

function openEditDialog(row) {
  applyProjectForm(editForm, row);
  editForm.id = row.id;
  editDialogVisible.value = true;
}

async function updateProject() {
  editLoading.value = true;
  try {
    await request(`/projects/${editForm.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        symbol: editForm.symbol,
        period: editForm.period,
        buyAmountPerOrder: editForm.buyAmountPerOrder,
        takeProfitMultiple: editForm.takeProfitMultiple,
        sellDivisor: editForm.sellDivisor,
        status: editForm.status
      })
    });
    editDialogVisible.value = false;
    ElMessage.success('项目已更新');
    await loadProjects(false);
    await selectProject(editForm.id);
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    editLoading.value = false;
  }
}

async function syncAll() {
  syncLoading.value = true;
  try {
    const data = await request('/market/sync', { method: 'POST' });
    const okCount = (data.results || []).filter((item) => item.ok).length;
    ElMessage.success(`同步完成，成功 ${okCount} 个项目`);
    await loadProjects(false);
    if (selectedProjectId.value) await selectProject(selectedProjectId.value);
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    syncLoading.value = false;
  }
}

async function syncOne(id) {
  syncLoading.value = true;
  try {
    await request(`/market/sync/${id}`, { method: 'POST' });
    ElMessage.success('单项目同步完成');
    await loadProjects(false);
    await selectProject(id);
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    syncLoading.value = false;
  }
}

async function removeProject(id) {
  try {
    await ElMessageBox.confirm('删除后会清空该项目的持仓、指标和信号记录，继续吗？', '确认删除', {
      type: 'warning'
    });
    await request(`/projects/${id}`, { method: 'DELETE' });
    ElMessage.success('项目已删除');
    await loadProjects();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '删除失败');
  }
}

onMounted(async () => {
  if (token.value) await loadProjects();
});
</script>

<template>
  <div v-if="!token" class="auth-wrap">
    <div class="auth-grid">
      <div class="auth-hero">
        <div class="hero-badge">LONGROOT TERMINAL</div>
        <h1 class="brand-title">LongRoot 金融控制台</h1>
        <p class="brand-subtitle">暗色交易终端风格，适配桌面与移动端，聚合查看项目、持仓、信号与指标。</p>
        <div class="hero-metrics">
          <div class="hero-metric">
            <span>市场同步</span>
            <strong>Binance</strong>
          </div>
          <div class="hero-metric">
            <span>策略核心</span>
            <strong>MACD + 限红</strong>
          </div>
          <div class="hero-metric">
            <span>默认接口</span>
            <strong>{{ API_BASE }}</strong>
          </div>
        </div>
      </div>

      <el-card class="auth-card panel-card">
        <div class="panel-title-row">
          <div>
            <div class="eyebrow">SECURE LOGIN</div>
            <h2 class="panel-title">进入交易面板</h2>
          </div>
          <div class="status-dot"></div>
        </div>

        <el-form label-position="top" @submit.prevent="handleLogin">
          <el-form-item label="用户名">
            <el-input v-model="loginForm.username" placeholder="admin" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="loginForm.password" show-password placeholder="请输入密码" @keyup.enter="handleLogin" />
          </el-form-item>
          <el-button type="primary" :loading="loginLoading" class="full-width" @click="handleLogin">
            登录控制台
          </el-button>
        </el-form>
      </el-card>
    </div>
  </div>

  <div v-else class="page-shell terminal-shell">
    <section class="hero-banner">
      <div>
        <div class="eyebrow">LIVE PORTFOLIO CONTROL</div>
        <h1>LongRoot 金融终端</h1>
        <p>已登录用户：{{ currentUser?.username }} · 管理策略项目、查看仓位变化、跟踪最近信号。</p>
      </div>
      <div class="top-actions">
        <el-button @click="loadProjects">刷新数据</el-button>
        <el-button type="primary" :loading="syncLoading" @click="syncAll">同步全部项目</el-button>
        <el-button type="danger" plain @click="logout">退出</el-button>
      </div>
    </section>

    <section class="metric-grid finance-metrics">
      <div class="metric-card accent-blue">
        <div class="metric-label">项目总数</div>
        <div class="metric-value">{{ metrics.total }}</div>
        <div class="metric-foot">当前纳入监控的策略数量</div>
      </div>
      <div class="metric-card accent-green">
        <div class="metric-label">启用项目</div>
        <div class="metric-value">{{ metrics.enabled }}</div>
        <div class="metric-foot">正在参与市场同步</div>
      </div>
      <div class="metric-card accent-gold">
        <div class="metric-label">累计投入</div>
        <div class="metric-value">{{ money(metrics.invested) }}</div>
        <div class="metric-foot">所有项目累计投入金额</div>
      </div>
      <div class="metric-card accent-purple">
        <div class="metric-label">当前持仓市值</div>
        <div class="metric-value">{{ money(metrics.value) }}</div>
        <div class="metric-foot">按最近价格估算的持仓价值</div>
      </div>
    </section>

    <section class="terminal-grid">
      <div class="main-column">
        <el-card class="panel-card glass-card">
          <template #header>
            <div class="panel-title-row">
              <div>
                <div class="eyebrow">PROJECT WATCHLIST</div>
                <div class="panel-title">项目列表</div>
              </div>
              <el-tag type="info">{{ projects.length }} 个</el-tag>
            </div>
          </template>

          <el-table v-loading="projectLoading" :data="projects" class="finance-table" @row-click="(row) => selectProject(row.id)">
            <el-table-column prop="project_code" label="项目编码" min-width="150" />
            <el-table-column prop="symbol" label="交易对" min-width="110" />
            <el-table-column prop="period" label="周期" width="80" />
            <el-table-column label="状态" width="96">
              <template #default="scope">
                <span class="status-pill" :class="Number(scope.row.status) === 1 ? 'status-on' : 'status-off'">{{ statusText(scope.row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最新信号" min-width="120">
              <template #default="scope">
                <span v-if="scope.row.latest_signal_action" class="signal-pill" :class="signalClass(scope.row.latest_signal_action)">
                  {{ scope.row.latest_signal_action }}
                </span>
                <span v-else class="muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="当前市值" min-width="120">
              <template #default="scope">{{ money(scope.row.position_value) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <div class="top-actions compact-actions">
                  <el-button link type="primary" @click.stop="openEditDialog(scope.row)">编辑</el-button>
                  <el-button link type="primary" @click.stop="syncOne(scope.row.id)">同步</el-button>
                  <el-button link type="danger" @click.stop="removeProject(scope.row.id)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="panel-card glass-card">
          <template #header>
            <div class="panel-title-row">
              <div>
                <div class="eyebrow">STRATEGY INPUT</div>
                <div class="panel-title">创建项目</div>
              </div>
            </div>
          </template>

          <el-form label-position="top">
            <div class="responsive-form-grid two-col">
              <el-form-item label="交易对"><el-input v-model="projectForm.symbol" placeholder="BTCUSDT" /></el-form-item>
              <el-form-item label="周期">
                <el-select v-model="projectForm.period" class="full-width">
                  <el-option label="H" value="H" />
                  <el-option label="D" value="D" />
                  <el-option label="W" value="W" />
                </el-select>
              </el-form-item>
            </div>

            <div class="responsive-form-grid three-col">
              <el-form-item label="每次买入金额"><el-input-number v-model="projectForm.buyAmountPerOrder" :min="0" :precision="2" class="full-width" /></el-form-item>
              <el-form-item label="限红倍数"><el-input-number v-model="projectForm.takeProfitMultiple" :min="0" :precision="2" class="full-width" /></el-form-item>
              <el-form-item label="卖出除数"><el-input-number v-model="projectForm.sellDivisor" :min="1" :precision="2" class="full-width" /></el-form-item>
            </div>

            <el-form-item label="状态">
              <el-radio-group v-model="projectForm.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>

            <div class="form-actions">
              <el-button type="primary" :loading="saveLoading" @click="createProject">创建项目</el-button>
            </div>
          </el-form>
        </el-card>
      </div>

      <div class="side-column">
        <el-card class="panel-card glass-card" v-loading="detailLoading">
          <template #header>
            <div class="panel-title-row">
              <div>
                <div class="eyebrow">POSITION SNAPSHOT</div>
                <div class="panel-title">项目详情</div>
              </div>
              <span v-if="projectDetail" class="status-pill" :class="Number(projectDetail.status) === 1 ? 'status-on' : 'status-off'">
                {{ statusText(projectDetail.status) }}
              </span>
            </div>
          </template>

          <template v-if="projectDetail">
            <div class="summary-head">
              <div>
                <div class="summary-symbol">{{ projectDetail.symbol }}</div>
                <div class="muted">{{ projectDetail.project_code }} · 周期 {{ projectDetail.period }}</div>
              </div>
              <div v-if="selectedSignal" class="signal-pill large" :class="signalClass(selectedSignal.action)">
                {{ selectedSignal.action }}
              </div>
            </div>

            <div class="project-meta">
              <div class="meta-item"><div class="label">每次买入金额</div><div class="value">{{ money(projectDetail.buy_amount_per_order) }}</div></div>
              <div class="meta-item"><div class="label">限红倍数</div><div class="value">{{ money(projectDetail.take_profit_multiple) }}</div></div>
              <div class="meta-item"><div class="label">限红金额</div><div class="value">{{ money(projectDetail.take_profit_amount) }}</div></div>
              <div class="meta-item"><div class="label">卖出除数</div><div class="value">{{ money(projectDetail.sell_divisor) }}</div></div>
              <div class="meta-item"><div class="label">持仓数量</div><div class="value">{{ money(projectDetail.position_qty, 8) }}</div></div>
              <div class="meta-item"><div class="label">累计投入</div><div class="value">{{ money(projectDetail.total_invested) }}</div></div>
              <div class="meta-item"><div class="label">累计变现</div><div class="value">{{ money(projectDetail.total_realized) }}</div></div>
              <div class="meta-item"><div class="label">当前持仓市值</div><div class="value">{{ money(projectDetail.position_value) }}</div></div>
              <div class="meta-item"><div class="label">最大敞口</div><div class="value">{{ money(projectDetail.max_exposure) }}</div></div>
              <div class="meta-item"><div class="label">最大损失</div><div class="value">{{ money(projectDetail.max_loss) }}</div></div>
            </div>

            <div v-if="selectedSignal" class="reason-card">
              <div class="eyebrow">LATEST STRATEGY REASON</div>
              <div class="reason-main">{{ selectedSignal.reason }}</div>
              <div class="reason-sub">{{ formatTime(selectedSignal.signal_time) }} · 价格 {{ money(selectedSignal.price, 4) }}</div>
            </div>

            <div v-if="selectedIndicator" class="indicator-strip">
              <div class="indicator-chip">
                <span>DIF</span>
                <strong>{{ selectedIndicator.dif }}</strong>
              </div>
              <div class="indicator-chip">
                <span>DEA</span>
                <strong>{{ selectedIndicator.dea }}</strong>
              </div>
              <div class="indicator-chip">
                <span>价格</span>
                <strong>{{ selectedIndicator.price }}</strong>
              </div>
            </div>
          </template>
          <el-empty v-else description="先从左侧选择一个项目" />
        </el-card>

        <el-card class="panel-card glass-card">
          <template #header>
            <div class="panel-title-row">
              <div>
                <div class="eyebrow">SIGNAL TAPE</div>
                <div class="panel-title">最近交易信号</div>
              </div>
            </div>
          </template>
          <el-table :data="projectSignals" class="finance-table compact-table" empty-text="暂无信号">
            <el-table-column prop="signal_time" label="时间" min-width="150"><template #default="scope">{{ formatTime(scope.row.signal_time) }}</template></el-table-column>
            <el-table-column label="动作" width="90"><template #default="scope"><span class="signal-pill" :class="signalClass(scope.row.action)">{{ scope.row.action }}</span></template></el-table-column>
            <el-table-column prop="amount" label="金额/数量" min-width="110" />
            <el-table-column prop="price" label="价格" min-width="100" />
          </el-table>
        </el-card>

        <el-card class="panel-card glass-card">
          <template #header>
            <div class="panel-title-row">
              <div>
                <div class="eyebrow">INDICATOR FEED</div>
                <div class="panel-title">最近指标</div>
              </div>
            </div>
          </template>
          <el-table :data="projectIndicators" class="finance-table compact-table" empty-text="暂无指标">
            <el-table-column prop="candle_time" label="K线时间" min-width="150"><template #default="scope">{{ formatTime(scope.row.candle_time) }}</template></el-table-column>
            <el-table-column prop="price" label="价格" min-width="100" />
            <el-table-column prop="dif" label="DIF" min-width="100" />
            <el-table-column prop="dea" label="DEA" min-width="100" />
          </el-table>
        </el-card>
      </div>
    </section>

    <el-dialog v-model="editDialogVisible" title="编辑项目" width="560px">
      <el-form label-position="top">
        <div class="responsive-form-grid two-col">
          <el-form-item label="交易对"><el-input v-model="editForm.symbol" /></el-form-item>
          <el-form-item label="周期"><el-select v-model="editForm.period" class="full-width"><el-option label="H" value="H" /><el-option label="D" value="D" /><el-option label="W" value="W" /></el-select></el-form-item>
        </div>
        <div class="responsive-form-grid three-col">
          <el-form-item label="每次买入金额"><el-input-number v-model="editForm.buyAmountPerOrder" :min="0" :precision="2" class="full-width" /></el-form-item>
          <el-form-item label="限红倍数"><el-input-number v-model="editForm.takeProfitMultiple" :min="0" :precision="2" class="full-width" /></el-form-item>
          <el-form-item label="卖出除数"><el-input-number v-model="editForm.sellDivisor" :min="1" :precision="2" class="full-width" /></el-form-item>
        </div>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="top-actions" style="justify-content: flex-end">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="editLoading" @click="updateProject">保存修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
