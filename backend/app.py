from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)

# ==========================================
# CONFIGURATION
# ==========================================

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///ruralhome.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
CORS(app)


# ==========================================
# PRODUCT MODEL
# ==========================================

class Product(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)

    category = db.Column(db.String(100), nullable=False)

    seller = db.Column(db.String(100), nullable=False)

    price = db.Column(db.Float, nullable=False)

    unit = db.Column(db.String(50), nullable=False)

    emoji = db.Column(db.String(20), default="🛒")

    fresh = db.Column(db.Boolean, default=False)


# ==========================================
# ORDER MODEL
# ==========================================

class Order(db.Model):

    id = db.Column(db.Integer, primary_key=True)

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


# ==========================================
# CREATE DATABASE
# ==========================================

with app.app_context():
    db.create_all()


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    return jsonify({
        "message": "RuralHome Delivery Backend is Running!",
        "status": "success"
    })


# ==========================================
# GET PRODUCTS
# ==========================================

@app.route("/api/products", methods=["GET"])
def get_products():

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


# ==========================================
# ADD PRODUCT
# ==========================================

@app.route("/api/products", methods=["POST"])
def add_product():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data received"
        }), 400

    product = Product(

        name=data.get("name"),

        category=data.get("category"),

        seller=data.get("seller"),

        price=float(data.get("price", 0)),

        unit=data.get("unit"),

        emoji=data.get("emoji", "🛒"),

        fresh=data.get("fresh", False)

    )

    db.session.add(product)

    db.session.commit()

    return jsonify({

        "message": "Product added successfully",

        "product_id": product.id

    }), 201


# ==========================================
# PLACE ORDER
# ==========================================

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
                "error": f"{field} is required"
            }), 400

    order = Order(

        customer_name=data["customer_name"],

        mobile=data["mobile"],

        village=data["village"],

        address=data["address"],

        instructions=data.get(
            "instructions",
            ""
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

        status="Order Placed"

    )

    db.session.add(order)

    db.session.commit()

    return jsonify({

        "message": "Order placed successfully",

        "order_id": order.id,

        "status": order.status

    }), 201


# ==========================================
# GET ALL ORDERS
# ==========================================

@app.route("/api/orders", methods=["GET"])
def get_orders():

    orders = Order.query.order_by(
        Order.created_at.desc()
    ).all()

    result = []

    for order in orders:

        result.append({

            "id": order.id,

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
                order.created_at.isoformat()

            if order.created_at
            else None

        })

    return jsonify(result)


# ==========================================
# UPDATE ORDER STATUS
# ==========================================

@app.route(
    "/api/orders/<int:order_id>/status",
    methods=["PUT"]
)
def update_order_status(order_id):

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "Request data is required"
        }), 400

    new_status = data.get("status")

    allowed_statuses = [

        "Order Placed",

        "Preparing",

        "Out for Delivery",

        "Delivered",

        "Cancelled"

    ]

    if new_status not in allowed_statuses:

        return jsonify({

            "error": "Invalid order status",

            "allowed_statuses":
                allowed_statuses

        }), 400

    order = Order.query.get(order_id)

    if not order:

        return jsonify({

            "error": "Order not found"

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


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )