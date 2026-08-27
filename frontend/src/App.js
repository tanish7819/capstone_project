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

  // Quantity selected for each product
  const [quantities, setQuantities] = useState({});

  // Kubernetes NodePort URLs
  const PRODUCT_URL = "http://34.131.106.198:30500";
  const ORDER_URL = "http://34.131.106.198:30501";
  const INVENTORY_URL = "http://34.131.106.198:30502";

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

  // Change quantity for a product
  const changeQuantity = (id, value) => {
    setQuantities({
      ...quantities,
      [id]: value,
    });
  };

  // Create Order
  const createOrder = async (id) => {
    try {
      const quantity = Number(quantities[id]) || 1;

      if (quantity <= 0) {
        alert("Quantity must be greater than 0");
        return;
      }

      const res = await axios.post(`${ORDER_URL}/orders`, {
        product_id: id,
        quantity: quantity,
      });

      alert(
        `Order created successfully. Remaining stock: ${res.data.remainingStock}`
      );

      // Reset quantity
      setQuantities({
        ...quantities,
        [id]: 1,
      });

      // Reload all data
      loadProducts();
      loadOrders();
      loadInventory();

    } catch (err) {
      console.error("Error creating order:", err);

      if (err.response && err.response.data) {
        alert(err.response.data.error || "Failed to create order");
      } else {
        alert("Failed to create order");
      }
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

// Delete Product
const deleteProduct = async (id) => {
  if (!window.confirm("Are you sure you want to delete this product?")) {
    return;
  }

  try {
    await axios.delete(`${PRODUCT_URL}/products/${id}`);

    alert("Product and inventory deleted successfully");

    // Refresh all data
    loadProducts();
    loadInventory();
    loadOrders();
  } catch (err) {
    console.error("Error deleting product:", err);

    if (err.response && err.response.data) {
      alert(err.response.data.error || "Failed to delete product");
    } else {
      alert("Failed to delete product");
    }
  }
};

  return (
    <div style={{ padding: 40 }}>
      <h2>Ecommerce Platform - v1.1</h2>

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

            {" "}

            <input
              type="number"
              min="1"
              value={quantities[p.id] || 1}
              onChange={(e) =>
                changeQuantity(p.id, e.target.value)
              }
              style={{ width: "60px" }}
            />

            <button onClick={() => createOrder(p.id)}>
              Order
            </button>

            {" "}

            <input
              placeholder="new stock"
              onChange={(e) => setUpdateStock(e.target.value)}
            />

            <button onClick={() => updateInventory(p.id)}>
              Update Stock
            </button>
	    <button onClick={() => deleteProduct(p.id)}>
              Delete
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
