import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [updateStock, setUpdateStock] = useState("");

  // Kubernetes NodePort URLs
  const PRODUCT_URL = "http://192.168.49.2:30500";
  const ORDER_URL = "http://192.168.49.2:30501";
  const INVENTORY_URL = "http://192.168.49.2:30502";

  // Load Products
  const loadProducts = async () => {
    try {
      const res = await axios.get(`${PRODUCT_URL}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  // Load Orders
  const loadOrders = async () => {
    try {
      const res = await axios.get(`${ORDER_URL}/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  };

  // Load Inventory
  const loadInventory = async () => {
    try {
      const res = await axios.get(`${INVENTORY_URL}/inventory`);
      setInventory(res.data);
    } catch (err) {
      console.error("Error loading inventory:", err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
    loadInventory();
  }, []);

  // Add Product
  const addProduct = async () => {
    try {
      await axios.post(`${PRODUCT_URL}/products`, {
        name,
        price,
        stock,
      });

      setName("");
      setPrice("");
      setStock("");

      loadProducts();
      loadInventory();
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  // Create Order
  const createOrder = async (id) => {
    try {
      await axios.post(`${ORDER_URL}/orders`, {
        product_id: id,
        quantity: 1,
      });

      loadOrders();
      loadInventory();
    } catch (err) {
      console.error("Error creating order:", err);
    }
  };

  // Update Inventory
  const updateInventory = async (id) => {
    try {
      await axios.put(`${INVENTORY_URL}/inventory/${id}`, {
        stock: updateStock,
      });

      setUpdateStock("");

      loadInventory();
      loadProducts();
    } catch (err) {
      console.error("Error updating inventory:", err);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Ecommerce Platform</h2>

      <h3>Add Product</h3>

      <input
        placeholder="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        placeholder="stock"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />

      <button onClick={addProduct}>Add</button>

      <h3>Products</h3>

      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} ₹{p.price} stock:{p.stock}

            <button onClick={() => createOrder(p.id)}>
              Order
            </button>

            <input
              placeholder="new stock"
              onChange={(e) => setUpdateStock(e.target.value)}
            />

            <button onClick={() => updateInventory(p.id)}>
              Update Stock
            </button>
          </li>
        ))}
      </ul>

      <h3>Orders</h3>

      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            Order #{o.id} product:{o.product_id} qty:{o.quantity}
          </li>
        ))}
      </ul>

      <h3>Inventory</h3>

      <ul>
        {inventory.map((i) => (
          <li key={i.product_id}>
            Product {i.product_id} stock:{i.stock}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
