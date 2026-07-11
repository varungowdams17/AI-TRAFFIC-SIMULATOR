"""
app.py
AI Traffic Simulator – Flask Backend
Main application entry point with CORS, blueprints, and database initialization.
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os

from routes.traffic_routes import traffic_bp
from routes.algorithm_routes import algorithm_bp
from routes.analytics_routes import analytics_bp
from database.db import init_db


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'aai-traffic-simulator-vtu-2024'
    app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'database', 'traffic.db')

    # Allow React dev server
    CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

    with app.app_context():
        init_db(app)

    app.register_blueprint(traffic_bp,   url_prefix='/api/traffic')
    app.register_blueprint(algorithm_bp, url_prefix='/api/algorithms')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'message': 'AI Traffic Simulator API running', 'version': '1.0.0'})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': str(e)}), 500

    return app


if __name__ == '__main__':
    app = create_app()
    print("=" * 60)
    print("  AI Traffic Simulator – Backend")
    print("  http://localhost:5000")
    print("  Health: http://localhost:5000/api/health")
    print("=" * 60)
    # use_reloader=False prevents double-startup issues
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
