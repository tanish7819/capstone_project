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

  // Loading states
  const [addingProduct, setAddingProduct] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState({});
  const [updatingInventory, setUpdatingInventory] = useState({});
  const [deletingProduct, setDeletingProduct] = useState({});
  const [deletingOrder, setDeletingOrder] = useState({});

  // Kubernetes NodePort URLs
  const PRODUCT_URL = "http://34.131.106.198:30500";
  const ORDER_URL = "http://34.131.106.198:30501";
  const INVENTORY_URL = "http://34.131.106.198:30502";

  // =========================
  // Load Products
  // =========================
  const loadProducts = async () => {
    try {
      const res = await axios.get(`${PRODUCT_URL}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  // =========================
  // Load Orders
  // =========================
  const loadOrders = async () => {
    try {
      const res = await axios.get(`${ORDER_URL}/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  };

  // =========================
  // Load Inventory
  // =========================
  const loadInventory = async () => {
    try {
      const res = await axios.get(`${INVENTORY_URL}/inventory`);
      setInventory(res.data);
    } catch (err) {
      console.error("Error loading inventory:", err);
    }
  };

  // =========================
  // Initial Load
  // =========================
  useEffect(() => {
    loadProducts();
    loadOrders();
    loadInventory();
  }, []);

  // =========================
  // Add Product
  // =========================
  const addProduct = async () => {
    if (addingProduct) {
      return;
    }

    if (!name.trim()) {
      alert("Please enter product name");
      return;
    }

    if (price === "" || Number(price) < 0) {
      alert("Please enter a valid price");
      return;
    }

    if (stock === "" || Number(stock) < 0) {
      alert("Please enter a valid stock");
      return;
    }

    setAddingProduct(true);

    try {
      await axios.post(`${PRODUCT_URL}/products`, {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
      });

      setName("");
      setPrice("");
      setStock("");

      // Refresh products and inventory after successful addition
      await Promise.all([
        loadProducts(),
        loadInventory(),
      ]);

      alert("Product added successfully");

    } catch (err) {
      console.error("Error adding product:", err);

      if (err.response && err.response.data) {
        alert(
          err.response.data.error || "Failed to add product"
        );
      } else {
        alert("Failed to add product");
      }
    } finally {
      setAddingProduct(false);
    }
  };

  // =========================
  // Change Quantity
  // =========================
  const changeQuantity = (id, value) => {
    setQuantities((previous) => ({
      ...previous,
      [id]: value,
    }));
  };

  // =========================
  // Create Order
  // =========================
  const createOrder = async (id) => {
    if (creatingOrder[id]) {
      return;
    }

    const quantity = Number(quantities[id]) || 1;

    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    setCreatingOrder((previous) => ({
      ...previous,
      [id]: true,
    }));

    try {
      const res = await axios.post(`${ORDER_URL}/orders`, {
        product_id: id,
        quantity: quantity,
      });

      alert(
        `Order created successfully. Remaining stock: ${res.data.remainingStock}`
      );

      // Reset quantity
      setQuantities((previous) => ({
        ...previous,
        [id]: 1,
      }));

      // Refresh all related data
      await Promise.all([
        loadProducts(),
        loadOrders(),
        loadInventory(),
      ]);

    } catch (err) {
      console.error("Error creating order:", err);

      if (err.response && err.response.data) {
        alert(
          err.response.data.error || "Failed to create order"
        );
      } else {
        alert("Failed to create order");
      }
    } finally {
      setCreatingOrder((previous) => ({
        ...previous,
        [id]: false,
      }));
    }
  };

  // =========================
  // Update Inventory
  // =========================
  const updateInventory = async (id) => {
    if (updatingInventory[id]) {
      return;
    }

    if (
      updateStock === "" ||
      Number(updateStock) < 0
    ) {
      alert("Please enter a valid stock");
      return;
    }

    setUpdatingInventory((previous) => ({
      ...previous,
      [id]: true,
    }));

    try {
      await axios.put(`${INVENTORY_URL}/inventory/${id}`, {
        stock: Number(updateStock),
      });

      setUpdateStock("");

      // Refresh inventory and products
      await Promise.all([
        loadInventory(),
        loadProducts(),
      ]);

      alert("Stock updated successfully");

    } catch (err) {
      console.error("Error updating inventory:", err);

      if (err.response && err.response.data) {
        alert(
          err.response.data.error || "Failed to update stock"
        );
      } else {
        alert("Failed to update stock");
      }
    } finally {
      setUpdatingInventory((previous) => ({
        ...previous,
        [id]: false,
      }));
    }
  };

  // =========================
  // Delete Product
  // =========================
  const deleteProduct = async (id) => {
    if (deletingProduct[id]) {
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this product?"
      )
    ) {
      return;
    }

    setDeletingProduct((previous) => ({
      ...previous,
      [id]: true,
    }));

    try {
      await axios.delete(`${PRODUCT_URL}/products/${id}`);

      // Refresh all affected data
      await Promise.all([
        loadProducts(),
        loadInventory(),
        loadOrders(),
      ]);

      alert("Product and inventory deleted successfully");

    } catch (err) {
      console.error("Error deleting product:", err);

      if (err.response && err.response.data) {
        alert(
          err.response.data.error || "Failed to delete product"
        );
      } else {
        alert("Failed to delete product");
      }
    } finally {
      setDeletingProduct((previous) => ({
        ...previous,
        [id]: false,
      }));
    }
  };

  // =========================
  // Delete Order
  // =========================
  const deleteOrder = async (id) => {
    if (deletingOrder[id]) {
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this order?"
      )
    ) {
      return;
    }

    setDeletingOrder((previous) => ({
      ...previous,
      [id]: true,
    }));

    try {
      await axios.delete(`${ORDER_URL}/orders/${id}`);

      // Refresh orders
      await loadOrders();

      alert("Order deleted successfully");

    } catch (err) {
      console.error("Error deleting order:", err);

      if (err.response && err.response.data) {
        alert(
          err.response.data.error || "Failed to delete order"
        );
      } else {
        alert("Failed to delete order");
      }
    } finally {
      setDeletingOrder((previous) => ({
        ...previous,
        [id]: false,
      }));
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 40 }}>

      <h2>Ecommerce Platform - v1.1</h2>

      {/* =========================
          ADD PRODUCT
      ========================= */}
      <h3>Add Product</h3>

      <input
        placeholder="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="price"
        type="number"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        placeholder="stock"
        type="number"
        min="0"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />

      <button
        onClick={addProduct}
        disabled={addingProduct}
      >
        {addingProduct ? "Adding..." : "Add"}
      </button>

      {/* =========================
          PRODUCTS
      ========================= */}
      <h3>Products</h3>

      <ul>
        {products.map((p) => (
          <li key={p.id}>

            {p.name} ₹{p.price} stock:{p.stock}

            {" "}

            {/* Quantity */}
            <input
              type="number"
              min="1"
              value={quantities[p.id] || 1}
              onChange={(e) =>
                changeQuantity(
                  p.id,
                  e.target.value
                )
              }
              style={{ width: "60px" }}
            />

            {" "}

            {/* Order */}
            <button
              onClick={() =>
                createOrder(p.id)
              }
              disabled={creatingOrder[p.id]}
            >
              {creatingOrder[p.id]
                ? "Ordering..."
                : "Order"}
            </button>

            {" "}

            {/* Update Stock */}
            <input
              placeholder="new stock"
              type="number"
              min="0"
              onChange={(e) =>
                setUpdateStock(e.target.value)
              }
            />

            {" "}

            <button
              onClick={() =>
                updateInventory(p.id)
              }
              disabled={updatingInventory[p.id]}
            >
              {updatingInventory[p.id]
                ? "Updating..."
                : "Update Stock"}
            </button>

            {" "}

            {/* Delete Product */}
            <button
              onClick={() =>
                deleteProduct(p.id)
              }
              disabled={deletingProduct[p.id]}
            >
              {deletingProduct[p.id]
                ? "Deleting..."
                : "Delete"}
            </button>

          </li>
        ))}
      </ul>

      {/* =========================
          ORDERS
      ========================= */}
      <h3>Orders</h3>

      <ul>
        {orders.map((o) => (
          <li key={o.id}>

            Order #{o.id}
            {" "}
            product:{o.product_id}
            {" "}
            qty:{o.quantity}

            {" "}

            <button
              onClick={() =>
                deleteOrder(o.id)
              }
              disabled={deletingOrder[o.id]}
            >
              {deletingOrder[o.id]
                ? "Deleting..."
                : "Delete"}
            </button>

          </li>
        ))}
      </ul>

      {/* =========================
          INVENTORY
      ========================= */}
      <h3>Inventory</h3>

      <ul>
        {inventory.map((i) => (
          <li key={i.product_id}>
            Product {i.product_id}
            {" "}
            stock:{i.stock}
          </li>
        ))}
      </ul>

    </div>
  );
}

export default App;