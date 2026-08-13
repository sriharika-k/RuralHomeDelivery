import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)

# ============================================================
# CONFIGURATION
# ============================================================

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///ruralhome.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ============================================================
# CORS CONFIGURATION
# ============================================================
# Allows:
# 1. Local React/Vite frontend
# 2. GitHub Pages frontend
# 3. Local network access during development

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://sriharika-k.github.io"
            ]
        }
    }
)


# ============================================================
# PRODUCT MODEL
# ============================================================

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    category = db.Column(
        db.String(100),
        nullable=False
    )

    seller = db.Column(
        db.String(100),
        nullable=False
    )

    price = db.Column(
        db.Float,
        nullable=False
    )

    unit = db.Column(
        db.String(50),
        nullable=False
    )

    emoji = db.Column(
        db.String(20),
        default="🛒"
    )

    fresh = db.Column(
        db.Boolean,
        default=False
    )


# ============================================================
# ORDER MODEL
# ============================================================

class Order(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    customer_name = db.Column(
        db.String(100),
        nullable=False
    )

    mobile = db.Column(
        db.String(20),
        nullable=False
    )

    village = db.Column(
        db.String(100),
        nullable=False
    )

    address = db.Column(
        db.Text,
        nullable=False
    )

    instructions = db.Column(
        db.Text
    )

    payment_method = db.Column(
        db.String(50),
        default="Cash on Delivery"
    )

    items = db.Column(
        db.Text,
        nullable=False
    )

    subtotal = db.Column(
        db.Float,
        nullable=False
    )

    delivery_fee = db.Column(
        db.Float,
        nullable=False
    )

    total = db.Column(
        db.Float,
        nullable=False
    )

    status = db.Column(
        db.String(50),
        default="Order Placed"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    latitude = db.Column(
        db.Float,
        nullable=True
    )

    longitude = db.Column(
        db.Float,
        nullable=True
    )

    pin_code = db.Column(
        db.String(20),
        nullable=True
    )


# ============================================================
# CREATE DATABASE
# ============================================================

with app.app_context():
    db.create_all()


# ============================================================
# DATABASE MIGRATION
# ============================================================

def migrate_order_location_columns():

    try:
        inspector = db.inspect(db.engine)

        tables = inspector.get_table_names()

        if "order" not in tables:
            return

        columns = [
            column["name"]
            for column in inspector.get_columns("order")
        ]

        with db.engine.begin() as connection:

            if "latitude" not in columns:
                connection.exec_driver_sql(
                    'ALTER TABLE "order" ADD COLUMN latitude REAL'
                )

            if "longitude" not in columns:
                connection.exec_driver_sql(
                    'ALTER TABLE "order" ADD COLUMN longitude REAL'
                )

            if "pin_code" not in columns:
                connection.exec_driver_sql(
                    'ALTER TABLE "order" ADD COLUMN pin_code VARCHAR(20)'
                )

    except Exception as error:

        print(
            "Database migration warning:",
            error
        )


with app.app_context():
    migrate_order_location_columns()


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return jsonify({
        "message": "RuralHomeDelivery Backend is Running!",
        "status": "success"
    })


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "success",
        "message": "Backend is connected successfully"
    })


# ============================================================
# GET PRODUCTS
# ============================================================

@app.route("/api/products", methods=["GET"])
def get_products():

    try:

        products = Product.query.all()

        result = []

        for product in products:

            result.append({

                "id": product.id,

                "name": product.name,

                "category": product.category,

                "seller": product.seller,

                "price": product.price,

                "unit": product.unit,

                "emoji": product.emoji,

                "fresh": product.fresh

            })

        return jsonify(result)

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500


# ============================================================
# ADD PRODUCT
# ============================================================

@app.route("/api/products", methods=["POST"])
def add_product():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "No data received"
        }), 400

    try:

        name = data.get("name")

        category = data.get("category")

        seller = data.get("seller")

        price = float(
            data.get("price", 0)
        )

        unit = data.get(
            "unit",
            "piece"
        )

        emoji = data.get(
            "emoji",
            "🛒"
        )

        fresh = data.get(
            "fresh",
            False
        )

        if not name:

            return jsonify({
                "error": "Product name is required"
            }), 400

        if not category:

            return jsonify({
                "error": "Category is required"
            }), 400

        if not seller:

            return jsonify({
                "error": "Seller name is required"
            }), 400

        if price <= 0:

            return jsonify({
                "error": "Price must be greater than 0"
            }), 400

        product = Product(

            name=name,

            category=category,

            seller=seller,

            price=price,

            unit=unit,

            emoji=emoji,

            fresh=fresh

        )

        db.session.add(product)

        db.session.commit()

        return jsonify({

            "message":
                "Product added successfully",

            "product_id":
                product.id

        }), 201

    except Exception as error:

        db.session.rollback()

        return jsonify({
            "error": str(error)
        }), 500


# ============================================================
# PLACE ORDER
# ============================================================

@app.route("/api/orders", methods=["POST"])
def place_order():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "No order data received"
        }), 400

    required_fields = [

        "customer_name",
        "mobile",
        "village",
        "address",
        "items",
        "subtotal",
        "delivery_fee",
        "total"

    ]

    for field in required_fields:

        if field not in data:

            return jsonify({

                "error":
                    f"{field} is required"

            }), 400

    try:

        latitude = data.get(
            "latitude"
        )

        longitude = data.get(
            "longitude"
        )

        pin_code = (
            data.get("pin_code")
            or data.get("pincode")
            or data.get("pin")
        )

        # ----------------------------------------------------
        # Convert latitude
        # ----------------------------------------------------

        latitude_value = None

        if latitude not in (
            None,
            ""
        ):

            latitude_value = float(
                latitude
            )

        # ----------------------------------------------------
        # Convert longitude
        # ----------------------------------------------------

        longitude_value = None

        if longitude not in (
            None,
            ""
        ):

            longitude_value = float(
                longitude
            )

        # ----------------------------------------------------
        # Convert PIN
        # ----------------------------------------------------

        pin_value = None

        if pin_code not in (
            None,
            ""
        ):

            pin_value = str(
                pin_code
            )

        # ----------------------------------------------------
        # Create order
        # ----------------------------------------------------

        order = Order(

            customer_name=str(
                data["customer_name"]
            ),

            mobile=str(
                data["mobile"]
            ),

            village=str(
                data["village"]
            ),

            address=str(
                data["address"]
            ),

            instructions=str(
                data.get(
                    "instructions",
                    ""
                )
            ),

            payment_method=data.get(
                "payment_method",
                "Cash on Delivery"
            ),

            items=str(
                data["items"]
            ),

            subtotal=float(
                data["subtotal"]
            ),

            delivery_fee=float(
                data["delivery_fee"]
            ),

            total=float(
                data["total"]
            ),

            status="Order Placed",

            latitude=latitude_value,

            longitude=longitude_value,

            pin_code=pin_value

        )

        db.session.add(order)

        db.session.commit()

        return jsonify({

            "message":
                "Order placed successfully",

            "order_id":
                order.id,

            "status":
                order.status

        }), 201

    except Exception as error:

        db.session.rollback()

        print(
            "ORDER ERROR:",
            error
        )

        return jsonify({

            "error":
                str(error)

        }), 500


# ============================================================
# GET ALL ORDERS
# ============================================================

@app.route("/api/orders", methods=["GET"])
def get_orders():

    try:

        orders = Order.query.order_by(
            Order.created_at.desc()
        ).all()

        result = []

        for order in orders:

            result.append({

                "id":
                    order.id,

                "customer_name":
                    order.customer_name,

                "mobile":
                    order.mobile,

                "village":
                    order.village,

                "address":
                    order.address,

                "instructions":
                    order.instructions,

                "payment_method":
                    order.payment_method,

                "items":
                    order.items,

                "subtotal":
                    order.subtotal,

                "delivery_fee":
                    order.delivery_fee,

                "total":
                    order.total,

                "status":
                    order.status,

                "created_at":
                    (
                        order.created_at.isoformat()
                        if order.created_at
                        else None
                    ),

                "latitude":
                    order.latitude,

                "longitude":
                    order.longitude,

                "pin_code":
                    order.pin_code

            })

        return jsonify(result)

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500


# ============================================================
# GET SINGLE ORDER
# ============================================================

@app.route(
    "/api/orders/<int:order_id>",
    methods=["GET"]
)
def get_single_order(order_id):

    order = db.session.get(
        Order,
        order_id
    )

    if not order:

        return jsonify({

            "error":
                "Order not found"

        }), 404

    return jsonify({

        "id":
            order.id,

        "customer_name":
            order.customer_name,

        "mobile":
            order.mobile,

        "village":
            order.village,

        "address":
            order.address,

        "instructions":
            order.instructions,

        "payment_method":
            order.payment_method,

        "items":
            order.items,

        "subtotal":
            order.subtotal,

        "delivery_fee":
            order.delivery_fee,

        "total":
            order.total,

        "status":
            order.status,

        "created_at":
            (
                order.created_at.isoformat()
                if order.created_at
                else None
            ),

        "latitude":
            order.latitude,

        "longitude":
            order.longitude,

        "pin_code":
            order.pin_code

    })


# ============================================================
# UPDATE ORDER STATUS
# ============================================================

@app.route(
    "/api/orders/<int:order_id>/status",
    methods=["PUT"]
)
def update_order_status(order_id):

    data = request.get_json()

    if not data:

        return jsonify({

            "error":
                "Request data is required"

        }), 400

    new_status = data.get(
        "status"
    )

    allowed_statuses = [

        "Order Placed",

        "Preparing",

        "Out for Delivery",

        "Delivered",

        "Cancelled"

    ]

    if new_status not in allowed_statuses:

        return jsonify({

            "error":
                "Invalid order status",

            "allowed_statuses":
                allowed_statuses

        }), 400

    order = db.session.get(
        Order,
        order_id
    )

    if not order:

        return jsonify({

            "error":
                "Order not found"

        }), 404

    order.status = new_status

    db.session.commit()

    return jsonify({

        "message":
            "Order status updated successfully",

        "order_id":
            order.id,

        "status":
            order.status

    })


# ============================================================
# ADD INITIAL PRODUCTS
# ============================================================

def add_initial_products():

    if Product.query.count() > 0:

        return

    products = [

        # ====================================================
        # VEGETABLES
        # ====================================================

        {
            "name": "Potato",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 40,
            "unit": "kg",
            "emoji": "🥔"
        },

        {
            "name": "Tomato",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 35,
            "unit": "kg",
            "emoji": "🍅"
        },

        {
            "name": "Onion",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 40,
            "unit": "kg",
            "emoji": "🧅"
        },

        {
            "name": "Brinjal / Eggplant",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 45,
            "unit": "kg",
            "emoji": "🍆"
        },

        {
            "name": "Okra / Lady's Finger",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 50,
            "unit": "kg",
            "emoji": "🌿"
        },

        {
            "name": "Bitter Gourd",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 55,
            "unit": "kg",
            "emoji": "🥒"
        },

        {
            "name": "Bottle Gourd",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 35,
            "unit": "piece",
            "emoji": "🥒"
        },

        {
            "name": "Ridge Gourd",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 45,
            "unit": "kg",
            "emoji": "🥒"
        },

        {
            "name": "Snake Gourd",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 40,
            "unit": "kg",
            "emoji": "🥒"
        },

        {
            "name": "Cucumber",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 35,
            "unit": "kg",
            "emoji": "🥒"
        },

        {
            "name": "Carrot",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 60,
            "unit": "kg",
            "emoji": "🥕"
        },

        {
            "name": "Radish",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 35,
            "unit": "kg",
            "emoji": "🌱"
        },

        {
            "name": "Cabbage",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 35,
            "unit": "piece",
            "emoji": "🥬"
        },

        {
            "name": "Cauliflower",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 50,
            "unit": "piece",
            "emoji": "🥦"
        },

        {
            "name": "Spinach",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 25,
            "unit": "bunch",
            "emoji": "🥬"
        },

        {
            "name": "Coriander Leaves",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 20,
            "unit": "bunch",
            "emoji": "🌿"
        },

        {
            "name": "Ivy Gourd",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 45,
            "unit": "kg",
            "emoji": "🥒"
        },

        {
            "name": "Drumstick",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 60,
            "unit": "kg",
            "emoji": "🌿"
        },

        {
            "name": "Cluster Beans",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 55,
            "unit": "kg",
            "emoji": "🌿"
        },

        {
            "name": "Green Chili",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 80,
            "unit": "kg",
            "emoji": "🌶️"
        },

        {
            "name": "Ginger",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 120,
            "unit": "kg",
            "emoji": "🫚"
        },

        {
            "name": "Garlic",
            "category": "Vegetables",
            "seller": "Local Farmer",
            "price": 160,
            "unit": "kg",
            "emoji": "🧄"
        },

        # ====================================================
        # FRUITS
        # ====================================================

        {
            "name": "Mango",
            "category": "Fruits",
            "seller": "Local Fruit Seller",
            "price": 100,
            "unit": "kg",
            "emoji": "🥭"
        },

        {
            "name": "Banana",
            "category": "Fruits",
            "seller": "Local Fruit Seller",
            "price": 50,
            "unit": "dozen",
            "emoji": "🍌"
        },

        {
            "name": "Apple",
            "category": "Fruits",
            "seller": "Local Fruit Seller",
            "price": 150,
            "unit": "kg",
            "emoji": "🍎"
        },

        {
            "name": "Guava",
            "category": "Fruits",
            "seller": "Local Fruit Seller",
            "price": 70,
            "unit": "kg",
            "emoji": "🍐"
        },

        {
            "name": "Papaya",
            "category": "Fruits",
            "seller": "Local Fruit Seller",
            "price": 50,
            "unit": "kg",
            "emoji": "🍈"
        },

        {
            "name": "Pomegranate",
            "category": "Fruits",
            "seller": "Local Fruit Seller",
            "price": 180,
            "unit": "kg",
            "emoji": "🍎"
        },

        {
            "name": "Watermelon",
            "category": "Fruits",
            "seller": "Local Fruit Seller",
            "price": 35,
            "unit": "kg",
            "emoji": "🍉"
        },

        {
            "name": "Grapes",
            "category": "Fruits",
            "seller": "Local Fruit Seller",
            "price": 100,
            "unit": "kg",
            "emoji": "🍇"
        },

        # ====================================================
        # DAIRY
        # ====================================================

        {
            "name": "Milk",
            "category": "Dairy",
            "seller": "Local Dairy",
            "price": 60,
            "unit": "litre",
            "emoji": "🥛"
        },

        {
            "name": "Curd / Yogurt",
            "category": "Dairy",
            "seller": "Local Dairy",
            "price": 70,
            "unit": "kg",
            "emoji": "🥣"
        },

        {
            "name": "Buttermilk",
            "category": "Dairy",
            "seller": "Local Dairy",
            "price": 30,
            "unit": "litre",
            "emoji": "🥛"
        },

        {
            "name": "Ghee",
            "category": "Dairy",
            "seller": "Local Dairy",
            "price": 600,
            "unit": "kg",
            "emoji": "🧈"
        },

        {
            "name": "Butter",
            "category": "Dairy",
            "seller": "Local Dairy",
            "price": 550,
            "unit": "kg",
            "emoji": "🧈"
        },

        {
            "name": "Cheese",
            "category": "Dairy",
            "seller": "Local Dairy",
            "price": 400,
            "unit": "kg",
            "emoji": "🧀"
        },

        # ====================================================
        # GROCERIES
        # ====================================================

        {
            "name": "Coriander Seeds",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 180,
            "unit": "kg",
            "emoji": "🌿"
        },

        {
            "name": "Rice",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 60,
            "unit": "kg",
            "emoji": "🍚"
        },

        {
            "name": "Wheat",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 50,
            "unit": "kg",
            "emoji": "🌾"
        },

        {
            "name": "Toor Dal",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 150,
            "unit": "kg",
            "emoji": "🫘"
        },

        {
            "name": "Moong Dal",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 130,
            "unit": "kg",
            "emoji": "🫘"
        },

        {
            "name": "Sugar",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 50,
            "unit": "kg",
            "emoji": "🍚"
        },

        {
            "name": "Salt",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 25,
            "unit": "kg",
            "emoji": "🧂"
        },

        {
            "name": "Cooking Oil",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 140,
            "unit": "litre",
            "emoji": "🫗"
        },

        {
            "name": "Turmeric Powder",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 180,
            "unit": "kg",
            "emoji": "🟡"
        },

        {
            "name": "Red Chili Powder",
            "category": "Groceries",
            "seller": "Local Grocery Shop",
            "price": 220,
            "unit": "kg",
            "emoji": "🌶️"
        }

    ]

    for item in products:

        product = Product(

            name=item["name"],

            category=item["category"],

            seller=item["seller"],

            price=item["price"],

            unit=item["unit"],

            emoji=item["emoji"],

            fresh=True

        )

        db.session.add(product)

    db.session.commit()

    print(
        f"Added {len(products)} initial products."
    )


# ============================================================
# START APPLICATION
# ============================================================

if __name__ == "__main__":

    with app.app_context():

        add_initial_products()

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    print("")
    print("=" * 60)
    print("🌾 RuralHomeDelivery Backend")
    print("=" * 60)
    print("Backend URL:")
    print("http://127.0.0.1:5000")
    print("")
    print("Products API:")
    print("http://127.0.0.1:5000/api/products")
    print("")
    print("Orders API:")
    print("http://127.0.0.1:5000/api/orders")
    print("")
    print("Health Check:")
    print("http://127.0.0.1:5000/api/health")
    print("=" * 60)
    print("")

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )