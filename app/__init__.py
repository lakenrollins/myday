import os
from flask import Flask, render_template, request, session, redirect
from flask_cors import CORS
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_login import LoginManager
from .models import db, User
from .api.user_routes import user_routes
from .api.auth_routes import auth_routes
from .api.pin_routes import pin_routes
from .api.board_routes import board_routes
from .api.comment_routes import comment_routes
from .seeds import seed_commands
from .config import Config

app = Flask(__name__, static_folder='../react-vite/dist', static_url_path='/')
app.url_map.strict_slashes = False

# Setup login manager
login = LoginManager(app)
login.login_view = 'auth.unauthorized'


@login.user_loader
def load_user(id):
    return User.query.get(int(id))


# Tell flask about our seed commands
app.cli.add_command(seed_commands)

app.config.from_object(Config)
app.register_blueprint(user_routes, url_prefix='/api/users')
app.register_blueprint(auth_routes, url_prefix='/api/auth')
app.register_blueprint(pin_routes, url_prefix='/api/pins')
app.register_blueprint(board_routes, url_prefix='/api/boards')
app.register_blueprint(comment_routes, url_prefix='/api/comments')
db.init_app(app)
Migrate(app, db)

# Application Security
# For development, allow localhost origins
# For production, CORS is not needed since frontend and backend are on same domain
if os.environ.get('FLASK_ENV') == 'development':
    CORS(app, 
         origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"], 
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-CSRFToken"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
else:
    # In production, allow same-origin requests only
    CORS(app, supports_credentials=True)

# Disable CSRF for API endpoints in development
if os.environ.get('FLASK_ENV') != 'production':
    pass  # Skip CSRF in development
else:
    csrf = CSRFProtect(app)


# Since we are deploying with Docker and Flask,
# we won't be using a buildpack when we deploy to Heroku.
# Therefore, we need to make sure that in production any
# request made over http is redirected to https.
# Well.........
@app.before_request
def https_redirect():
    if os.environ.get('FLASK_ENV') == 'production':
        if request.headers.get('X-Forwarded-Proto') == 'http':
            url = request.url.replace('http://', 'https://', 1)
            code = 301
            return redirect(url, code=code)


@app.after_request
def inject_csrf_token(response):
    response.set_cookie(
        'csrf_token',
        generate_csrf(),
        secure=True if os.environ.get('FLASK_ENV') == 'production' else False,
        samesite='Strict' if os.environ.get(
            'FLASK_ENV') == 'production' else None,
        httponly=False)
    return response


@app.route("/api/csrf/restore")
def restore_csrf():
    """
    Returns the CSRF token for the frontend to use
    """
    return {'csrf_token': generate_csrf()}


@app.route("/api/docs")
def api_help():
    """
    Returns all API routes and their doc strings
    """
    acceptable_methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    route_list = { rule.rule: [[ method for method in rule.methods if method in acceptable_methods ],
                    app.view_functions[rule.endpoint].__doc__ ]
                    for rule in app.url_map.iter_rules() if rule.endpoint != 'static' }
    return route_list


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def react_root(path):
    """
    This route will direct to the public directory in our
    react builds in the production environment for favicon
    or index.html requests
    """
    if path == 'favicon.ico':
        return app.send_from_directory('public', 'favicon.ico')
    return app.send_static_file('index.html')


@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')
