import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

// Get the API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const PlatformStats = ({ stats }) => (
  <div className="platform-stats">
    {Object.entries(stats).map(([platform, data]) => (
      <div key={platform} className="platform-card">
        <h3>{platform}</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{data.total}</span>
          </div>
          <div className="stat-item success">
            <span className="stat-label">Success:</span>
            <span className="stat-value">{data.success}</span>
          </div>
          <div className="stat-item failed">
            <span className="stat-label">Failed:</span>
            <span className="stat-value">{data.failed}</span>
          </div>
          <div className="stat-item pending">
            <span className="stat-label">Pending:</span>
            <span className="stat-value">{data.pending}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const OrderDetails = ({ order }) => (
  <div className="order-details">
    <h4>Order Details</h4>
    <p>Total Amount: ${order.orderDetails?.amount?.toFixed(2)} {order.orderDetails?.currency}</p>
    <div className="items-list">
      {order.orderDetails?.items?.map((item, index) => (
        <div key={index} className="item">
          <span>{item.name}</span>
          <span>x{item.quantity}</span>
          <span>${item.price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  </div>
);

const App = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(res.data.orders);
      setStats(res.data.stats);
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const syncOrders = async (platform) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/orders/sync`, {
        platform,
        orders: Array(5).fill(null).map(() => ({
          orderId: `${platform.toUpperCase()}-${Math.floor(Math.random() * 10000)}`
        }))
      });
      fetchOrders();
    } catch (err) {
      setError(`Failed to sync ${platform} orders. Please try again.`);
      console.error(err);
    }
    setLoading(false);
  };

  const retryOrder = async (id) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/orders/retry/${id}`);
      fetchOrders();
    } catch (err) {
      setError('Failed to retry order. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="container">
      <header>
        <h1>📦 Multi-Channel Order Sync Tracker</h1>
        <div className="actions">
          <button 
            onClick={() => syncOrders('Shopify')} 
            disabled={loading}
            className="btn btn-primary"
          >
            Sync Shopify Orders
          </button>
          <button 
            onClick={() => syncOrders('Amazon')} 
            disabled={loading}
            className="btn btn-primary"
          >
            Sync Amazon Orders
          </button>
          <button 
            onClick={() => syncOrders('eBay')} 
            disabled={loading}
            className="btn btn-primary"
          >
            Sync eBay Orders
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <PlatformStats stats={stats} />

      <div className="orders-container">
        <h2>Recent Orders</h2>
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Details</th>
                <th>Error</th>
                <th>Retries</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className={`status-${order.status}`}>
                  <td>{order.orderId}</td>
                  <td>{order.platform}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <OrderDetails order={order} />
                  </td>
                  <td className="error-cell">
                    {order.errorMessage && (
                      <span className="error-message" title={order.errorMessage}>
                        {order.errorMessage}
                      </span>
                    )}
                  </td>
                  <td>{order.retryCount || 0}</td>
                  <td>
                    {order.status === 'failed' && (
                      <button
                        onClick={() => retryOrder(order._id)}
                        disabled={loading}
                        className="btn btn-retry"
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
