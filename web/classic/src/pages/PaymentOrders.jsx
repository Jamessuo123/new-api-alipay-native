import React, { useEffect, useState } from 'react';

const statusText = {
  pending: '待支付',
  created: '已创建',
  waiting: '待支付',
  success: '已支付',
  paid: '已支付',
  completed: '已支付',
  complete: '已支付',
  failed: '支付失败',
  expired: '已超时',
  closed: '已关闭',
  refunded: '已退款',
};

function formatTime(value) {
  if (!value || Number(value) === 0) return '-';
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return new Date(numeric > 1000000000000 ? numeric : numeric * 1000).toLocaleString();
  }
  return String(value);
}

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return '-';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `¥${numeric.toFixed(2)}`;
}

export default function PaymentOrders() {
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ p: '1', page_size: '50' });
      if (keyword.trim()) query.set('keyword', keyword.trim());
      const response = await fetch(`/api/user/payment/orders?${query.toString()}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json();
      const body = payload?.data;
      const items = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : Array.isArray(body?.data) ? body.data : [];
      setOrders(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>支付订单管理</h2>
        <button onClick={loadOrders} disabled={loading}>{loading ? '刷新中...' : '刷新'}</button>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') void loadOrders(); }}
          placeholder='搜索订单号'
          style={{ width: 280, padding: '8px 10px' }}
        />
        <button onClick={loadOrders}>搜索</button>
      </div>
      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #eee', borderRadius: 8 }}>
        <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f7f7f7' }}>
              <th style={{ padding: 10, textAlign: 'left' }}>下单时间</th>
              <th style={{ padding: 10, textAlign: 'left' }}>用户名</th>
              <th style={{ padding: 10, textAlign: 'left' }}>用户ID</th>
              <th style={{ padding: 10, textAlign: 'left' }}>订单号</th>
              <th style={{ padding: 10, textAlign: 'left' }}>支付渠道</th>
              <th style={{ padding: 10, textAlign: 'right' }}>付款金额</th>
              <th style={{ padding: 10, textAlign: 'right' }}>到账额度</th>
              <th style={{ padding: 10, textAlign: 'left' }}>支付状态</th>
              <th style={{ padding: 10, textAlign: 'left' }}>支付完成时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#888' }}>{loading ? '加载中...' : '暂无订单'}</td></tr>
            ) : orders.map((order) => {
              const orderNo = order.order_no || order.trade_no || '-';
              const normalizedStatus = String(order.status || '').toLowerCase();
              return (
                <tr key={order.id || orderNo} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 10 }}>{formatTime(order.create_time || order.created_at)}</td>
                  <td style={{ padding: 10 }}>{order.username || '-'}</td>
                  <td style={{ padding: 10 }}>{order.user_id ?? '-'}</td>
                  <td style={{ padding: 10, fontFamily: 'monospace', wordBreak: 'break-all' }}>{orderNo}</td>
                  <td style={{ padding: 10 }}>{order.payment_method || order.payment_provider || '-'}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{formatMoney(order.pay_money ?? order.money)}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{order.amount ?? '-'}</td>
                  <td style={{ padding: 10 }}>{statusText[normalizedStatus] || order.status || '-'}</td>
                  <td style={{ padding: 10 }}>{formatTime(order.paid_at || order.complete_time)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
