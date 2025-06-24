import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const res = await axios.get('http://localhost:5000/api/orders');
    setOrders(res.data);
  };

  const syncOrders = async (platform) => {
    await axios.post('http://localhost:5000/api/orders/sync', {
      platform,
      orders: [
        { orderId: `${platform.toUpperCase()}-${Math.floor(Math.random() * 10000)}` },
        { orderId: `${platform.toUpperCase()}-${Math.floor(Math.random() * 10000)}` }
      ]
    });
    fetchOrders();
  };

  const retryOrder = async (id) => {
    await axios.post(`http://localhost:5000/api/orders/retry/${id}`);
    fetchOrders();
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>📦 Multi-Channel Order Sync Tracker</h2>
      <button onClick={() => syncOrders('Shopify')} style={{ marginRight: '10px' }}>Sync Shopify Orders</button>
      <button onClick={() => syncOrders('Amazon')}>Sync Amazon Orders</button>

      <h4 style={{ marginTop: '20px' }}>Total Orders: {orders.length}</h4>

      <table border="1" cellPadding="8" style={{ marginTop: '10px', width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Platform</th>
            <th>Status</th>
            <th>Retry</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order._id}>
              <td>{order.orderId}</td>
              <td>{order.platform}</td>
              <td style={{ color: order.status === 'failed' ? 'red' : 'green' }}>{order.status}</td>
              <td>
                {order.status === 'failed' && (
                  <button onClick={() => retryOrder(order._id)}>Retry</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
