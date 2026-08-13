import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000";

function SellerDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Vegetables",
    seller: "",
    price: "",
    unit: "kg",
    emoji: "🥕",
  });

  const loadOrders = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/orders`
      );

      if (!response.ok) {
        throw new Error("Could not load orders");
      }

      const data = await response.json();

      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
        ? data.orders
        : [];

      setOrders(orderList);
    } catch (error) {
      console.error(error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/products`
      );

      if (!response.ok) {
        throw new Error("Could not load products");
      }

      const data = await response.json();

      const productList = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      setProducts(productList);
    } catch (error) {
      console.error(error);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);

    await Promise.all([
      loadOrders(),
      loadProducts(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadOrders();
      loadProducts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (
    order,
    newStatus
  ) => {
    const orderId =
      order.id ||
      order.order_id ||
      order._id;

    if (!orderId) {
      alert("Order ID not found.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Status update failed"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((item) => {
          const itemId =
            item.id ||
            item.order_id ||
            item._id;

          return String(itemId) ===
            String(orderId)
            ? {
                ...item,
                status: newStatus,
              }
            : item;
        })
      );
    } catch (error) {
      console.error(error);

      alert(
        "Could not update order status."
      );
    }
  };

  const handleProductChange = (
    field,
    value
  ) => {
    setNewProduct((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addProduct = async (event) => {
    event.preventDefault();

    if (
      !newProduct.name ||
      !newProduct.seller ||
      !newProduct.price
    ) {
      alert(
        "Please fill product name, seller and price."
      );
      return;
    }

    setAddingProduct(true);

    try {
      const response = await fetch(
        `${API_URL}/api/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newProduct.name,
            category: newProduct.category,
            seller: newProduct.seller,
            price: Number(newProduct.price),
            unit: newProduct.unit,
            emoji: newProduct.emoji,
            fresh: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Product could not be added"
        );
      }

      alert(
        "✅ Product added successfully!"
      );

      setNewProduct({
        name: "",
        category: "Vegetables",
        seller: "",
        price: "",
        unit: "kg",
        emoji: "🥕",
      });

      setShowAddProduct(false);

      await loadProducts();
    } catch (error) {
      console.error(error);

      alert(
        "Could not add product. Make sure Flask is running."
      );
    } finally {
      setAddingProduct(false);
    }
  };

  const pendingOrders = orders.filter(
    (order) =>
      String(
        order.status || "Pending"
      ).toLowerCase() === "pending"
  );

  const processingOrders = orders.filter(
    (order) =>
      String(
        order.status || ""
      ).toLowerCase() === "processing"
  );

  const deliveredOrders = orders.filter(
    (order) =>
      String(
        order.status || ""
      ).toLowerCase() === "delivered"
  );

  const getOrderId = (order) =>
    order.id ||
    order.order_id ||
    order._id ||
    "N/A";

  const getCustomerName = (order) =>
    order.customer_name ||
    order.name ||
    "Customer";

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "5px" }}>
            🌾 Seller Dashboard
          </h1>

          <p>
            Manage products and customer orders
          </p>
        </div>

        <button
          onClick={loadDashboard}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "35px",
        }}
      >
        <div
          style={{
            padding: "25px",
            borderRadius: "12px",
            background: "#fff8df",
          }}
        >
          <h2>📦</h2>
          <h2>{orders.length}</h2>
          <p>Total Orders</p>
        </div>

        <div
          style={{
            padding: "25px",
            borderRadius: "12px",
            background: "#fff4d6",
          }}
        >
          <h2>🟡</h2>
          <h2>
            {pendingOrders.length}
          </h2>
          <p>Pending</p>
        </div>

        <div
          style={{
            padding: "25px",
            borderRadius: "12px",
            background: "#eaf4ff",
          }}
        >
          <h2>🔵</h2>
          <h2>
            {processingOrders.length}
          </h2>
          <p>Processing</p>
        </div>

        <div
          style={{
            padding: "25px",
            borderRadius: "12px",
            background: "#eaf8ed",
          }}
        >
          <h2>🟢</h2>
          <h2>
            {deliveredOrders.length}
          </h2>
          <p>Delivered</p>
        </div>

        <div
          style={{
            padding: "25px",
            borderRadius: "12px",
            background: "#f1eaff",
          }}
        >
          <h2>🛍️</h2>
          <h2>{products.length}</h2>
          <p>Products</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <h2>
          🛍️ Seller Products
        </h2>

        <button
          onClick={() =>
            setShowAddProduct(
              !showAddProduct
            )
          }
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "700",
          }}
        >
          {showAddProduct
            ? "✕ Close"
            : "➕ Add Product"}
        </button>
      </div>

      {showAddProduct && (
        <form
          onSubmit={addProduct}
          style={{
            padding: "25px",
            marginBottom: "30px",
            borderRadius: "15px",
            background: "#f7faf5",
            border: "1px solid #ddd",
          }}
        >
          <h2>
            ➕ Add New Product
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(event) =>
                handleProductChange(
                  "name",
                  event.target.value
                )
              }
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />

            <select
              value={newProduct.category}
              onChange={(event) =>
                handleProductChange(
                  "category",
                  event.target.value
                )
              }
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            >
              <option>
                Vegetables
              </option>
              <option>
                Fruits
              </option>
              <option>
                Groceries
              </option>
              <option>
                Dairy
              </option>
              <option>
                Household
              </option>
            </select>

            <input
              type="text"
              placeholder="Seller Name"
              value={newProduct.seller}
              onChange={(event) =>
                handleProductChange(
                  "seller",
                  event.target.value
                )
              }
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />

            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(event) =>
                handleProductChange(
                  "price",
                  event.target.value
                )
              }
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />

            <select
              value={newProduct.unit}
              onChange={(event) =>
                handleProductChange(
                  "unit",
                  event.target.value
                )
              }
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            >
              <option>kg</option>
              <option>gram</option>
              <option>litre</option>
              <option>piece</option>
              <option>bunch</option>
              <option>dozen</option>
            </select>

            <input
              type="text"
              placeholder="Emoji"
              value={newProduct.emoji}
              onChange={(event) =>
                handleProductChange(
                  "emoji",
                  event.target.value
                )
              }
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={addingProduct}
            style={{
              marginTop: "20px",
              padding: "13px 25px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            {addingProduct
              ? "Adding..."
              : "✅ Add Product"}
          </button>
        </form>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "15px",
          marginBottom: "40px",
        }}
      >
        {products.length === 0 ? (
          <p>
            No products found.
          </p>
        ) : (
          products.map((product, index) => (
            <div
              key={
                product.id ||
                product.product_id ||
                index
              }
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "white",
                boxShadow:
                  "0 3px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "45px",
                }}
              >
                {product.emoji || "📦"}
              </div>

              <h3>
                {product.name}
              </h3>

              <p>
                {product.category}
              </p>

              <p>
                Seller:{" "}
                {product.seller ||
                  "Local Seller"}
              </p>

              <strong>
                ₹{product.price} /{" "}
                {product.unit}
              </strong>
            </div>
          ))
        )}
      </div>

      <h2
        style={{
          marginBottom: "20px",
        }}
      >
        🛒 Customer Orders
      </h2>

      {loading ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h3>
            Loading dashboard...
          </h3>
        </div>
      ) : orders.length === 0 ? (
        <div
          style={{
            padding: "50px",
            textAlign: "center",
            borderRadius: "12px",
            background: "#f7f7f7",
          }}
        >
          <div
            style={{
              fontSize: "50px",
            }}
          >
            📦
          </div>

          <h2>
            No orders yet
          </h2>

          <p>
            Customer orders will appear
            here.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {orders.map((order) => {
            const orderId =
              getOrderId(order);

            const status =
              order.status ||
              "Pending";

            return (
              <div
                key={orderId}
                style={{
                  background: "white",
                  borderRadius: "15px",
                  padding: "25px",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.08)",
                  border:
                    "1px solid #eee",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3>
                      📦 Order #{orderId}
                    </h3>

                    <p>
                      <strong>
                        Customer:
                      </strong>{" "}
                      {getCustomerName(
                        order
                      )}
                    </p>

                    <p>
                      <strong>
                        Mobile:
                      </strong>{" "}
                      {order.mobile ||
                        "N/A"}
                    </p>

                    <p>
                      <strong>
                        Village:
                      </strong>{" "}
                      {order.village ||
                        "N/A"}
                    </p>

                    <p>
                      <strong>
                        Address:
                      </strong>{" "}
                      {order.address ||
                        "N/A"}
                    </p>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        marginBottom:
                          "15px",
                      }}
                    >
                      {String(
                        status
                      ).toLowerCase() ===
                        "pending" &&
                        "🟡 Pending"}

                      {String(
                        status
                      ).toLowerCase() ===
                        "processing" &&
                        "🔵 Processing"}

                      {String(
                        status
                      ).toLowerCase() ===
                        "delivered" &&
                        "🟢 Delivered"}

                      {String(
                        status
                      ).toLowerCase() ===
                        "cancelled" &&
                        "🔴 Cancelled"}
                    </div>

                    <strong>
                      ₹
                      {order.total ||
                        0}
                    </strong>
                  </div>
                </div>

                <hr
                  style={{
                    margin: "20px 0",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() =>
                      updateStatus(
                        order,
                        "Pending"
                      )
                    }
                    style={{
                      padding:
                        "10px 18px",
                      border: "none",
                      borderRadius:
                        "8px",
                      cursor:
                        "pointer",
                    }}
                  >
                    🟡 Pending
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        order,
                        "Processing"
                      )
                    }
                    style={{
                      padding:
                        "10px 18px",
                      border: "none",
                      borderRadius:
                        "8px",
                      cursor:
                        "pointer",
                    }}
                  >
                    🔵 Processing
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        order,
                        "Delivered"
                      )
                    }
                    style={{
                      padding:
                        "10px 18px",
                      border: "none",
                      borderRadius:
                        "8px",
                      cursor:
                        "pointer",
                    }}
                  >
                    🟢 Delivered
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        order,
                        "Cancelled"
                      )
                    }
                    style={{
                      padding:
                        "10px 18px",
                      border: "none",
                      borderRadius:
                        "8px",
                      cursor:
                        "pointer",
                    }}
                  >
                    🔴 Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;