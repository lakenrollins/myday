from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from app.models import Comment, Pin, db
from app.forms import CommentForm

comment_routes = Blueprint('comments', __name__)

@comment_routes.route('', methods=['POST'])
@login_required
def create_comment():
    """Create a new comment on a pin"""
    form = CommentForm()
    # Get the csrf_token from the request cookie or header and put it into the
    # form manually to validate_on_submit can be used
    csrf_token = request.cookies.get('csrf_token') or request.headers.get('X-CSRFToken')
    form['csrf_token'].data = csrf_token
    
    # Get pin_id from JSON data
    data = request.get_json()
    if not data or not data.get('pin_id'):
        return jsonify({'error': 'Pin ID is required'}), 400
    
    pin_id = data.get('pin_id')
    pin = Pin.query.get(pin_id)
    if not pin:
        return jsonify({'error': 'Pin not found'}), 404
    
    # Check if user is trying to comment on their own pin
    if pin.user_id == current_user.id:
        return jsonify({'error': 'You cannot comment on your own pin'}), 403
    
    if form.validate_on_submit():
        comment = Comment(
            content=form.content.data,
            user_id=current_user.id,
            pin_id=pin_id
        )
        
        try:
            db.session.add(comment)
            db.session.commit()
            return jsonify(comment.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to create comment'}), 500
    
    return jsonify({'errors': form.errors}), 400

@comment_routes.route('/<int:comment_id>', methods=['PUT'])
@login_required
def update_comment(comment_id):
    """Update a comment"""
    comment = Comment.query.get(comment_id)
    
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404
    
    if comment.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    form = CommentForm()
    # Get the csrf_token from the request cookie or header and put it into the
    # form manually to validate_on_submit can be used
    csrf_token = request.cookies.get('csrf_token') or request.headers.get('X-CSRFToken')
    form['csrf_token'].data = csrf_token
    
    if form.validate_on_submit():
        comment.content = form.content.data
        db.session.commit()
        return jsonify(comment.to_dict()), 200
    
    return jsonify({'errors': form.errors}), 400

@comment_routes.route('/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    """Delete a comment"""
    comment = Comment.query.get(comment_id)
    
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404
    
    if comment.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(comment)
    db.session.commit()
    
    return jsonify({'message': 'Comment deleted successfully'}), 200

@comment_routes.route('/pin/<int:pin_id>', methods=['GET'])
def get_pin_comments(pin_id):
    """Get all comments for a specific pin"""
    pin = Pin.query.get(pin_id)
    
    if not pin:
        return jsonify({'error': 'Pin not found'}), 404
    
    comments = Comment.query.filter_by(pin_id=pin_id).order_by(Comment.created_at.desc()).all()
    
    return jsonify({
        'comments': [comment.to_dict() for comment in comments]
    }), 200