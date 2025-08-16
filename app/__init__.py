import os
from flask import Flask, request, redirect
from flask_cors import CORS
from flask_migrate import Migrate
from flask_wtf.csrf import generate_csrf
from flask_login import LoginManager
from .models import db, User
from .api.user_routes import user_routes
from .api.auth_routes import auth_routes
from .seeds import seed_commands
from .config import Config

# Extensions (not bound to app yet)
login = LoginManager()
login.login_view = 'auth.unauthorized'

migrate = Migrate()

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

def create_app():
    app = Flask(__name__, static_folder='../react-vite/dist', static_url_path='/')

    # Config
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)
    CORS(app)

    # Register blueprints
    app.register_blueprint(user_routes, url_prefix='/api/users')
    app.register_blueprint(auth_routes, url_prefix='/api/auth')

    # Add seed commands to Flask CLI
    app.cli.add_command(seed_commands)

    # HTTPS redirect (production only)
    @app.before_request
    def https_redirect():
        if os.environ.get('FLASK_ENV') == 'production':
            if request.headers.get('X-Forwarded-Proto') == 'http':
                url = request.url.replace('http://', 'https://', 1)
                return redirect(url, code=301)

    # Inject CSRF token into response cookies
    @app.after_request
    def inject_csrf_token(response):
        response.set_cookie(
            'csrf_token',
            generate_csrf(),
            secure=True if os.environ.get('FLASK_ENV') == 'production' else False,
            samesite='Strict' if os.environ.get('FLASK_ENV') == 'production' else None,
            httponly=True
        )
        return response

    # API Documentation route
    @app.route("/api/docs")
    def api_help():
        """
        Returns all API routes and their doc strings
        """
        acceptable_methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
        route_list = {
            rule.rule: [
                [method for method in rule.methods if method in acceptable_methods],
                app.view_functions[rule.endpoint].__doc__
            ]
            for rule in app.url_map.iter_rules() if rule.endpoint != 'static'
        }
        return route_list

    # React frontend routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def react_root(path):
        """
        Serve React build files
        """
        if path == 'favicon.ico':
            return app.send_from_directory('public', 'favicon.ico')
        return app.send_static_file('index.html')

    @app.errorhandler(404)
    def not_found(e):
        return app.send_static_file('index.html')

    return app
