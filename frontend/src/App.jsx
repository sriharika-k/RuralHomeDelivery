import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";
import SellerDashboard from "./SellerDashboard";

const API_URL = "http://127.0.0.1:5000";
const UPI_ID = "sriharika-k@upi";

const defaultProducts = [
  {
    id: 1,
    name: "Fresh Tomatoes",
    category: "Vegetables",
    seller: "Lakshmi Local Farm",
    price: 40,
    unit: "kg",
    emoji: "🍅",
    fresh: true,
  },
  {
    id: 2,
    name: "Fresh Potatoes",
    category: "Vegetables",
    seller: "Village Farmers",
    price: 35,
    unit: "kg",
    emoji: "🥔",
    fresh: true,
  },
  {
    id: 3,
    name: "Fresh Carrots",
    category: "Vegetables",
    seller: "Green Farm",
    price: 50,
    unit: "kg",
    emoji: "🥕",
    fresh: true,
  },
  {
    id: 4,
    name: "Fresh Spinach",
    category: "Vegetables",
    seller: "Ravi Farm",
    price: 20,
    unit: "bunch",
    emoji: "🥬",
    fresh: true,
  },
  {
    id: 5,
    name: "Bananas",
    category: "Fruits",
    seller: "Village Fruit Shop",
    price: 50,
    unit: "dozen",
    emoji: "🍌",
    fresh: true,
  },
  {
    id: 6,
    name: "Fresh Apples",
    category: "Fruits",
    seller: "Fresh Fruit Store",
    price: 120,
    unit: "kg",
    emoji: "🍎",
    fresh: false,
  },
  {
    id: 7,
    name: "Rice",
    category: "Groceries",
    seller: "Sri Sai General Store",
    price: 60,
    unit: "kg",
    emoji: "🍚",
    fresh: false,
  },
  {
    id: 8,
    name: "Cooking Oil",
    category: "Groceries",
    seller: "Sri Sai General Store",
    price: 140,
    unit: "litre",
    emoji: "🫗",
    fresh: false,
  },
];

const categories = [
  { name: "All", emoji: "🛍️" },
  { name: "Vegetables", emoji: "🥕" },
  { name: "Fruits", emoji: "🍎" },
  { name: "Groceries", emoji: "🌾" },
  { name: "Dairy", emoji: "🥛" },
  { name: "Household", emoji: "🧼" },
];

function App() {
  const [products, setProducts] = useState(defaultProducts);
  const [productsLoading, setProductsLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState("home");
  const [showLogin, setShowLogin] = useState(false);
  const [sellerMode, setSellerMode] = useState(false);

  const [location, setLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [showVillageSelector, setShowVillageSelector] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    mobile: "",
    village: "",
    address: "",
    instructions: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [cardDetails, setCardDetails] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);

      if (!response.ok) {
        throw new Error("Could not load products");
      }

      const data = await response.json();

      const backendProducts = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      if (backendProducts.length > 0) {
        const formattedProducts = backendProducts.map((product, index) => ({
          id: product.id || product.product_id || index + 1,
          name: product.name || "Unnamed Product",
          category: product.category || "Groceries",
          seller: product.seller || "Local Seller",
          price: Number(product.price || 0),
          unit: product.unit || "piece",
          emoji: product.emoji || "📦",
          fresh: product.fresh !== false,
        }));

        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error("Product loading error:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Your browser does not support location detection.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Could not find address");
          }

          const data = await response.json();
          const address = data.address || {};

          const detectedVillage =
            address.village ||
            address.hamlet ||
            address.town ||
            address.city ||
            address.suburb ||
            address.county ||
            "";

          const state = address.state || "";
          const country = address.country || "";

          let displayLocation = detectedVillage;

          if (state && detectedVillage) {
            displayLocation = `${detectedVillage}, ${state}`;
          }

          if (!displayLocation && data.display_name) {
            displayLocation = data.display_name.split(",").slice(0, 2).join(",");
          }

          if (!displayLocation) {
            displayLocation = "Location detected";
          }

          setLocation(displayLocation);

          setCustomer((current) => ({
            ...current,
            village: displayLocation,
          }));

          setShowVillageSelector(false);
        } catch (error) {
          console.error("Address detection error:", error);

          const coordinates = `${latitude.toFixed(
            4
          )}, ${longitude.toFixed(4)}`;

          setLocation(`Location detected (${coordinates})`);

          setCustomer((current) => ({
            ...current,
            village: `Location detected (${coordinates})`,
          }));

          alert(
            "Your location was detected, but the village name could not be found. You can enter your village manually."
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        setLocationLoading(false);

        if (error.code === 1) {
          alert(
            "Location permission was denied. Please allow location access in your browser."
          );
        } else if (error.code === 2) {
          alert("Your location could not be determined. Please try again.");
        } else if (error.code === 3) {
          alert("Location detection timed out. Please try again.");
        } else {
          alert("Unable to detect your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  const selectVillage = (village) => {
    setLocation(village);

    setCustomer((current) => ({
      ...current,
      village,
    }));

    setShowVillageSelector(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      const search = searchText.toLowerCase().trim();

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.seller.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchText]);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const increaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  };

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  const deliveryFee = subtotal > 0 ? 20 : 0;
  const total = subtotal + deliveryFee;

  const updateCustomer = (field, value) => {
    setCustomer((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateMobile = (value) => {
    const onlyNumbers = value.replace(/\D/g, "").slice(0, 10);

    setCustomer((current) => ({
      ...current,
      mobile: onlyNumbers,
    }));
  };

  const updateCardNumber = (value) => {
    const onlyNumbers = value.replace(/\D/g, "").slice(0, 16);

    setCardDetails((current) => ({
      ...current,
      number: onlyNumbers,
    }));
  };

  const updateExpiry = (value) => {
    let cleanValue = value.replace(/\D/g, "").slice(0, 4);

    if (cleanValue.length >= 3) {
      cleanValue =
        cleanValue.substring(0, 2) +
        "/" +
        cleanValue.substring(2);
    }

    setCardDetails((current) => ({
      ...current,
      expiry: cleanValue,
    }));
  };

  const updateCVV = (value) => {
    const onlyNumbers = value.replace(/\D/g, "").slice(0, 3);

    setCardDetails((current) => ({
      ...current,
      cvv: onlyNumbers,
    }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    if (
      !customer.name.trim() ||
      !customer.mobile ||
      !customer.village.trim() ||
      !customer.address.trim()
    ) {
      alert("Please fill in all required delivery fields.");
      return;
    }

    if (!/^\d{10}$/.test(customer.mobile)) {
      alert("Mobile number must contain exactly 10 digits.");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (paymentMethod === "card") {
      if (
        !cardDetails.name.trim() ||
        !/^\d{16}$/.test(cardDetails.number) ||
        !/^\d{2}\/\d{2}$/.test(cardDetails.expiry) ||
        !/^\d{3}$/.test(cardDetails.cvv)
      ) {
        alert(
          "Please enter valid card details: 16-digit card number, MM/YY expiry and 3-digit CVV."
        );
        return;
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customer.name,
          mobile: customer.mobile,
          village: customer.village,
          address: customer.address,
          instructions: customer.instructions,
          items: cart,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: total,
          status: "Pending",
          payment_method:
            paymentMethod === "cod"
              ? "Cash on Delivery"
              : paymentMethod === "upi"
              ? "UPI"
              : "Card",
        }),
      });

      if (!response.ok) {
        throw new Error("Order failed");
      }

      const data = await response.json();

      setOrderId(data.order_id || data.id || null);
      setOrderPlaced(true);
      setCart([]);

      setCardDetails({
        name: "",
        number: "",
        expiry: "",
        cvv: "",
      });
    } catch (error) {
      console.error(error);

      alert(
        "Order could not be connected to the backend. Please make sure Flask is running."
      );
    }
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setPage("home");
  };

  const goToCustomerApp = () => {
    setSellerMode(false);
    setPage("home");
    loadProducts();
  };

  const upiPaymentUrl =
    `upi://pay?pa=${encodeURIComponent(UPI_ID)}` +
    `&pn=${encodeURIComponent("RuralHome")}` +
    `&am=${encodeURIComponent(total.toFixed(2))}` +
    `&cu=INR`;

  return (
    <div className="app">
      {sellerMode ? (
        <>
          <div className="seller-dashboard-topbar">
            <button
              onClick={goToCustomerApp}
              className="seller-back-button"
            >
              ← Back to Customer App
            </button>
          </div>

          <SellerDashboard />
        </>
      ) : (
        <>
          <header className="header">
            <div
              className="logo"
              onClick={() => setPage("home")}
            >
              🌾 Rural
              <span>Home</span>
            </div>

            <button
              className="location-button"
              onClick={() => setShowVillageSelector(true)}
            >
              📍{" "}
              {locationLoading
                ? "Detecting..."
                : location || "Select your village"}
            </button>

            <div className="header-actions">
              <button
                className="seller-button"
                onClick={() => setSellerMode(true)}
              >
                🌾 Seller
              </button>

              <button
                className="login-button"
                onClick={() => setShowLogin(true)}
              >
                Login
              </button>

              <button
                className="cart-button"
                onClick={() => setPage("cart")}
              >
                🛒 Cart

                {totalItems > 0 && (
                  <span className="cart-count">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </header>

          {showVillageSelector && (
            <div
              className="modal-overlay"
              onClick={() => setShowVillageSelector(false)}
            >
              <div
                className="login-modal"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <button
                  className="close-modal"
                  onClick={() =>
                    setShowVillageSelector(false)
                  }
                >
                  ✕
                </button>

                <div className="login-icon">📍</div>

                <h2>Select Your Location</h2>

                <p>
                  Automatically detect your village or
                  enter it manually.
                </p>

                <button
                  className="primary-button"
                  onClick={detectLocation}
                  disabled={locationLoading}
                >
                  {locationLoading
                    ? "Detecting Location..."
                    : "📍 Detect My Location"}
                </button>

                <div
                  style={{
                    margin: "18px 0",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  OR
                </div>

                <input
                  type="text"
                  placeholder="Enter village / town"
                  value={customer.village}
                  onChange={(event) => {
                    updateCustomer(
                      "village",
                      event.target.value
                    );
                    setLocation(event.target.value);
                  }}
                />

                <button
                  className="primary-button"
                  onClick={() => {
                    if (!customer.village.trim()) {
                      alert("Please enter your village.");
                      return;
                    }

                    selectVillage(customer.village);
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {orderPlaced ? (
            <main className="success-page">
              <div className="success-card">
                <div className="success-icon">✓</div>

                <h1>Order Placed Successfully!</h1>

                <p>
                  Thank you, {customer.name}.
                </p>

                <p>
                  Your order will be delivered to:
                </p>

                <div className="delivery-address">
                  <strong>{customer.village}</strong>
                  <br />
                  {customer.address}
                </div>

                {orderId && (
                  <div className="order-number">
                    Order ID: RH{orderId}
                  </div>
                )}

                <button
                  className="primary-button"
                  onClick={() => {
                    setOrderPlaced(false);
                    setPage("home");

                    setCustomer({
                      name: "",
                      mobile: "",
                      village: "",
                      address: "",
                      instructions: "",
                    });

                    setPaymentMethod("cod");
                    loadProducts();
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            </main>
          ) : page === "checkout" ? (
            <main className="checkout-page">
              <button
                className="back-button"
                onClick={() => setPage("cart")}
              >
                ← Back to Cart
              </button>

              <h1>Checkout</h1>

              <div className="checkout-layout">
                <form
                  className="customer-form"
                  onSubmit={placeOrder}
                >
                  <h2>📍 Delivery Details</h2>

                  <p className="form-description">
                    Enter your details so we can deliver
                    your order to your home.
                  </p>

                  <label>Full Name *</label>

                  <input
                    type="text"
                    value={customer.name}
                    onChange={(event) =>
                      updateCustomer(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    required
                  />

                  <label>Mobile Number *</label>

                  <input
                    type="tel"
                    value={customer.mobile}
                    onChange={(event) =>
                      updateMobile(event.target.value)
                    }
                    placeholder="Enter 10 digit mobile number"
                    maxLength="10"
                    inputMode="numeric"
                    required
                  />

                  <small>
                    Enter exactly 10 digits.
                  </small>

                  <label>Village / Town *</label>

                  <input
                    type="text"
                    value={customer.village}
                    onChange={(event) => {
                      updateCustomer(
                        "village",
                        event.target.value
                      );
                      setLocation(event.target.value);
                    }}
                    placeholder="Enter your village"
                    required
                  />

                  <button
                    type="button"
                    className="location-button"
                    onClick={detectLocation}
                    disabled={locationLoading}
                    style={{ marginBottom: "15px" }}
                  >
                    📍{" "}
                    {locationLoading
                      ? "Detecting..."
                      : "Use My Current Location"}
                  </button>

                  <label>
                    House / Door Number & Address *
                  </label>

                  <textarea
                    value={customer.address}
                    onChange={(event) =>
                      updateCustomer(
                        "address",
                        event.target.value
                      )
                    }
                    placeholder="House number, street, landmark..."
                    rows="4"
                    required
                  />

                  <label>
                    Delivery Instructions
                  </label>

                  <textarea
                    value={customer.instructions}
                    onChange={(event) =>
                      updateCustomer(
                        "instructions",
                        event.target.value
                      )
                    }
                    placeholder="Example: Please call me when you arrive."
                    rows="3"
                  />

                  <h2 className="payment-title">
                    💳 Payment Method
                  </h2>

                  <div className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cod"}
                      onChange={() =>
                        setPaymentMethod("cod")
                      }
                    />

                    <div>
                      <strong>
                        💵 Cash on Delivery
                      </strong>

                      <p>
                        Pay when your order arrives.
                      </p>
                    </div>
                  </div>

                  <div className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "upi"}
                      onChange={() =>
                        setPaymentMethod("upi")
                      }
                    />

                    <div>
                      <strong>
                        📱 UPI Payment
                      </strong>

                      <p>
                        Pay using Google Pay, PhonePe,
                        Paytm or another UPI app.
                      </p>
                    </div>
                  </div>

                  {paymentMethod === "upi" && (
                    <div className="upi-payment-box">
                      <h3>📷 Scan & Pay</h3>

                      <p>
                        Scan this QR code using your
                        UPI application.
                      </p>

                      <div className="qr-container">
                        <QRCodeSVG
                          value={upiPaymentUrl}
                          size={220}
                          level="H"
                        />
                      </div>

                      <p>
                        <strong>UPI ID:</strong>{" "}
                        {UPI_ID}
                      </p>

                      <p>
                        <strong>Amount:</strong> ₹
                        {total}
                      </p>

                      <a
                        href={upiPaymentUrl}
                        className="upi-open-button"
                      >
                        Open UPI App
                      </a>

                      <small>
                        Payment confirmation should be
                        verified before treating an order
                        as paid.
                      </small>
                    </div>
                  )}

                  <div className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "card"}
                      onChange={() =>
                        setPaymentMethod("card")
                      }
                    />

                    <div>
                      <strong>
                        💳 Card Payment
                      </strong>

                      <p>
                        Enter card details for demo
                        payment.
                      </p>
                    </div>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="card-payment-box">
                      <h3>💳 Card Details</h3>

                      <label>Cardholder Name *</label>

                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(event) =>
                          setCardDetails((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Name on card"
                      />

                      <label>Card Number *</label>

                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(event) =>
                          updateCardNumber(
                            event.target.value
                          )
                        }
                        placeholder="16 digit card number"
                        maxLength="16"
                        inputMode="numeric"
                      />

                      <div className="card-row">
                        <div>
                          <label>Expiry *</label>

                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(event) =>
                              updateExpiry(
                                event.target.value
                              )
                            }
                            placeholder="MM/YY"
                            maxLength="5"
                          />
                        </div>

                        <div>
                          <label>CVV *</label>

                          <input
                            type="password"
                            value={cardDetails.cvv}
                            onChange={(event) =>
                              updateCVV(
                                event.target.value
                              )
                            }
                            placeholder="CVV"
                            maxLength="3"
                            inputMode="numeric"
                          />
                        </div>
                      </div>

                      <small>
                        Demo only. Card details are not
                        sent to the RuralHome backend.
                      </small>
                    </div>
                  )}

                  <button
                    className="place-order-button"
                    type="submit"
                  >
                    Place Order • ₹{total}
                  </button>
                </form>

                <div className="checkout-summary">
                  <h2>Your Order</h2>

                  {cart.map((item) => (
                    <div
                      className="checkout-item"
                      key={item.id}
                    >
                      <div className="checkout-item-image">
                        {item.emoji}
                      </div>

                      <div className="checkout-item-info">
                        <strong>{item.name}</strong>

                        <span>
                          {item.quantity} × ₹
                          {item.price}
                        </span>
                      </div>

                      <strong>
                        ₹
                        {Number(item.price) *
                          item.quantity}
                      </strong>
                    </div>
                  ))}

                  <hr />

                  <div className="summary-line">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>

                  <div className="summary-line">
                    <span>Delivery</span>
                    <span>₹{deliveryFee}</span>
                  </div>

                  <div className="summary-total">
                    <span>Total</span>
                    <strong>₹{total}</strong>
                  </div>
                </div>
              </div>
            </main>
          ) : page === "cart" ? (
            <main className="cart-page">
              <button
                className="back-button"
                onClick={() => setPage("home")}
              >
                ← Continue Shopping
              </button>

              <h1>Your Shopping Cart 🛒</h1>

              {cart.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">
                    🛒
                  </div>

                  <h2>Your cart is empty</h2>

                  <p>
                    Add fresh vegetables, fruits and
                    groceries to your cart.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => setPage("home")}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="cart-layout">
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div
                        className="cart-item"
                        key={item.id}
                      >
                        <div className="cart-item-image">
                          {item.emoji}
                        </div>

                        <div className="cart-item-details">
                          <h3>{item.name}</h3>

                          <p>{item.seller}</p>

                          <strong>
                            ₹{item.price} / {item.unit}
                          </strong>
                        </div>

                        <div className="quantity-control">
                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.id
                              )
                            }
                          >
                            −
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                          >
                            +
                          </button>
                        </div>

                        <div className="cart-item-price">
                          ₹
                          {Number(item.price) *
                            item.quantity}
                        </div>

                        <button
                          className="remove-button"
                          onClick={() =>
                            removeFromCart(item.id)
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="order-summary">
                    <h2>Order Summary</h2>

                    <div className="summary-line">
                      <span>Items</span>
                      <span>{totalItems}</span>
                    </div>

                    <div className="summary-line">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>

                    <div className="summary-line">
                      <span>Delivery</span>
                      <span>₹{deliveryFee}</span>
                    </div>

                    <hr />

                    <div className="summary-total">
                      <span>Total</span>
                      <strong>₹{total}</strong>
                    </div>

                    <button
                      className="checkout-button"
                      onClick={() =>
                        setPage("checkout")
                      }
                    >
                      Proceed to Checkout →
                    </button>
                  </div>
                </div>
              )}
            </main>
          ) : (
            <>
              <section className="hero">
                <div className="hero-content">
                  <div className="small-label">
                    🌱 Supporting Rural Communities
                  </div>

                  <h1>
                    Fresh & Essential Items
                    <br />
                    <span>
                      Delivered to Your Home
                    </span>
                  </h1>

                  <p>
                    Order fresh vegetables, fruits,
                    groceries and daily essentials
                    from nearby local shops and
                    farmers.
                  </p>

                  <div className="search-box">
                    <input
                      type="text"
                      value={searchText}
                      onChange={(event) =>
                        setSearchText(
                          event.target.value
                        )
                      }
                      placeholder="Search vegetables, fruits, groceries..."
                    />

                    <button>🔍 Search</button>
                  </div>
                </div>

                <div className="hero-vegetables">
                  <div>🥕</div>
                  <div>🍅</div>
                  <div>🥦</div>
                  <div>🥔</div>
                  <div>🍎</div>
                </div>
              </section>

              <section className="section">
                <div className="section-title">
                  <div>
                    <p className="section-label">
                      EXPLORE
                    </p>

                    <h2>Shop by Category</h2>
                  </div>
                </div>

                <div className="categories">
                  {categories.map((category) => (
                    <button
                      className={
                        selectedCategory ===
                        category.name
                          ? "category-card active"
                          : "category-card"
                      }
                      key={category.name}
                      onClick={() =>
                        selectCategory(
                          category.name
                        )
                      }
                    >
                      <div className="category-icon">
                        {category.emoji}
                      </div>

                      <span>
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="section products-section">
                <div className="section-title product-title">
                  <div>
                    <p className="section-label">
                      FRESH FROM LOCAL SELLERS
                    </p>

                    <h2>
                      {selectedCategory === "All"
                        ? "Fresh & Popular"
                        : selectedCategory}
                    </h2>
                  </div>

                  <span className="product-count">
                    {productsLoading
                      ? "Loading..."
                      : `${filteredProducts.length} products`}
                  </span>
                </div>

                <div className="products-grid">
                  {productsLoading ? (
                    <div className="no-products">
                      <div>⏳</div>

                      <h3>
                        Loading products...
                      </h3>

                      <p>
                        Getting products from local
                        sellers.
                      </p>
                    </div>
                  ) : filteredProducts.length ===
                    0 ? (
                    <div className="no-products">
                      <div>🔍</div>

                      <h3>No products found</h3>

                      <p>
                        Try another search or
                        category.
                      </p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        className="product-card"
                        key={product.id}
                      >
                        {product.fresh && (
                          <span className="fresh-badge">
                            Fresh Today
                          </span>
                        )}

                        <div className="product-image">
                          {product.emoji}
                        </div>

                        <div className="product-info">
                          <p className="seller-name">
                            {product.seller}
                          </p>

                          <h3>{product.name}</h3>

                          <p className="unit-text">
                            {product.category} •{" "}
                            {product.unit}
                          </p>

                          <div className="product-bottom">
                            <div className="price">
                              ₹{product.price}

                              <span>
                                / {product.unit}
                              </span>
                            </div>

                            <button
                              className="add-button"
                              onClick={() =>
                                addToCart(product)
                              }
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="why-section">
                <div className="why-content">
                  <p className="section-label">
                    WHY RURALHOME?
                  </p>

                  <h2>
                    Bringing the local market
                    closer to your home.
                  </h2>

                  <p>
                    We connect rural families
                    with nearby farmers,
                    vegetable sellers and local
                    shops. Shop locally and get
                    your daily essentials
                    delivered to your doorstep.
                  </p>

                  <div className="benefits">
                    <div>
                      <span>🥬</span>

                      <div>
                        <h3>Fresh Products</h3>

                        <p>
                          Fresh vegetables and
                          farm products from
                          local sellers.
                        </p>
                      </div>
                    </div>

                    <div>
                      <span>🏪</span>

                      <div>
                        <h3>
                          Support Local Sellers
                        </h3>

                        <p>
                          Help local farmers and
                          small shops reach more
                          customers.
                        </p>
                      </div>
                    </div>

                    <div>
                      <span>🏠</span>

                      <div>
                        <h3>Home Delivery</h3>

                        <p>
                          Order from home and
                          receive products at
                          your doorstep.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          <footer>
            <div className="footer-logo">
              🌾 Rural
              <span>Home</span>
            </div>

            <p>
              Connecting rural families with local
              shops and fresh farm products.
            </p>

            <p className="copyright">
              © 2026 RuralHome Delivery
            </p>
          </footer>

          {showLogin && (
            <div className="modal-overlay">
              <div className="login-modal">
                <button
                  className="close-modal"
                  onClick={() =>
                    setShowLogin(false)
                  }
                >
                  ✕
                </button>

                <div className="login-icon">
                  👋
                </div>

                <h2>Welcome to RuralHome</h2>

                <p>
                  Login will be connected to the
                  backend later.
                </p>

                <input
                  type="text"
                  placeholder="Mobile Number"
                  maxLength="10"
                  inputMode="numeric"
                />

                <button
                  className="primary-button"
                  onClick={() =>
                    setShowLogin(false)
                  }
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;