from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db, Pin, Board, Like
from app.forms import PinForm
from sqlalchemy import desc, or_

pin_routes = Blueprint('pins', __name__)

@pin_routes.route('', strict_slashes=False)
def get_pins():
    """Get all pins with pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    
    query = Pin.query
    
    # Search functionality
    if search:
        query = query.filter(
            or_(
                Pin.title.ilike(f'%{search}%'),
                Pin.description.ilike(f'%{search}%')
            )
        )
    
    # Category filtering (implement with tags in future)
    if category and category != 'All':
        # For now, just filter by title containing category
        query = query.filter(Pin.title.ilike(f'%{category}%'))
    
    # Order by creation date
    query = query.order_by(desc(Pin.created_at))
    
    # Paginate
    pins_paginated = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    return jsonify({
        'pins': [pin.to_dict() for pin in pins_paginated.items],
        'page': page,
        'pages': pins_paginated.pages,
        'per_page': per_page,
        'total': pins_paginated.total,
        'has_next': pins_paginated.has_next,
        'has_prev': pins_paginated.has_prev
    })

@pin_routes.route('/<int:pin_id>')
def get_pin(pin_id):
    """Get a specific pin"""
    pin = Pin.query.get(pin_id)
    if not pin:
        return jsonify({'error': 'Pin not found'}), 404
    
    return jsonify(pin.to_dict())

@pin_routes.route('', methods=['POST'], strict_slashes=False)
@login_required
def create_pin():
    """Create a new pin"""
    form = PinForm()
    form.csrf_token.data = request.cookies.get('csrf_token')
    
    if form.validate_on_submit():
        # Check if board exists and belongs to user
        board = None
        if form.board_id.data:
            board = Board.query.get(form.board_id.data)
            if not board or board.user_id != current_user.id:
                return jsonify({'error': 'Invalid board'}), 400
        
        pin = Pin(
            title=form.title.data,
            description=form.description.data,
            image_url=form.image_url.data,
            link=form.link.data,
            user_id=current_user.id,
            board_id=form.board_id.data
        )
        
        db.session.add(pin)
        db.session.commit()
        
        return jsonify(pin.to_dict()), 201
    
    return jsonify({'errors': form.errors}), 400

@pin_routes.route('/<int:pin_id>', methods=['PUT'])
@login_required
def update_pin(pin_id):
    """Update a pin"""
    pin = Pin.query.get(pin_id)
    if not pin:
        return jsonify({'error': 'Pin not found'}), 404
    
    if pin.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    form = PinForm()
    form.csrf_token.data = request.cookies.get('csrf_token')
    
    if form.validate_on_submit():
        # Check if board exists and belongs to user
        if form.board_id.data:
            board = Board.query.get(form.board_id.data)
            if not board or board.user_id != current_user.id:
                return jsonify({'error': 'Invalid board'}), 400
        
        pin.title = form.title.data
        pin.description = form.description.data
        pin.image_url = form.image_url.data
        pin.link = form.link.data
        pin.board_id = form.board_id.data
        
        db.session.commit()
        
        return jsonify(pin.to_dict())
    
    return jsonify({'errors': form.errors}), 400

@pin_routes.route('/<int:pin_id>', methods=['DELETE'])
@login_required
def delete_pin(pin_id):
    """Delete a pin"""
    pin = Pin.query.get(pin_id)
    if not pin:
        return jsonify({'error': 'Pin not found'}), 404
    
    if pin.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(pin)
    db.session.commit()
    
    return jsonify({'message': 'Pin deleted successfully'})

@pin_routes.route('/<int:pin_id>/like', methods=['POST'])
@login_required
def like_pin(pin_id):
    """Like or unlike a pin"""
    pin = Pin.query.get(pin_id)
    if not pin:
        return jsonify({'error': 'Pin not found'}), 404
    
    existing_like = Like.query.filter_by(
        user_id=current_user.id,
        pin_id=pin_id
    ).first()
    
    if existing_like:
        # Unlike the pin
        db.session.delete(existing_like)
        liked = False
    else:
        # Like the pin
        like = Like(user_id=current_user.id, pin_id=pin_id)
        db.session.add(like)
        liked = True
    
    db.session.commit()
    
    return jsonify({
        'liked': liked,
        'likes_count': len(pin.likes)
    })

@pin_routes.route('/<int:pin_id>/save', methods=['POST'])
@login_required
def save_pin(pin_id):
    """Save pin to a board"""
    pin = Pin.query.get(pin_id)
    if not pin:
        return jsonify({'error': 'Pin not found'}), 404
    
    board_id = request.json.get('board_id')
    if not board_id:
        return jsonify({'error': 'Board ID required'}), 400
    
    board = Board.query.get(board_id)
    if not board or board.user_id != current_user.id:
        return jsonify({'error': 'Invalid board'}), 400
    
    # Create a copy of the pin in the user's board
    new_pin = Pin(
        title=pin.title,
        description=pin.description,
        image_url=pin.image_url,
        link=pin.link,
        user_id=current_user.id,
        board_id=board_id
    )
    
    db.session.add(new_pin)
    db.session.commit()
    
    return jsonify({
        'message': 'Pin saved successfully',
        'pin': new_pin.to_dict()
    })

@pin_routes.route('/user/<int:user_id>')
def get_user_pins(user_id):
    """Get all pins by a specific user"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pins_paginated = Pin.query.filter_by(user_id=user_id)\
        .order_by(desc(Pin.created_at))\
        .paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
    
    return jsonify({
        'pins': [pin.to_dict() for pin in pins_paginated.items],
        'page': page,
        'pages': pins_paginated.pages,
        'per_page': per_page,
        'total': pins_paginated.total,
        'has_next': pins_paginated.has_next,
        'has_prev': pins_paginated.has_prev
    })

@pin_routes.route('/liked')
@login_required
def get_liked_pins():
    """Get pins liked by the current user"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Join pins with likes table to get liked pins
    pins_paginated = Pin.query\
        .join(Like, Pin.id == Like.pin_id)\
        .filter(Like.user_id == current_user.id)\
        .order_by(desc(Like.created_at))\
        .paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
    
    return jsonify({
        'pins': [pin.to_dict() for pin in pins_paginated.items],
        'page': page,
        'pages': pins_paginated.pages,
        'per_page': per_page,
        'total': pins_paginated.total,
        'has_next': pins_paginated.has_next,
        'has_prev': pins_paginated.has_prev
    })

@pin_routes.route('/user/<int:user_id>/liked')
def get_user_liked_pins(user_id):
    """Get pins liked by a specific user (public)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Join pins with likes table to get liked pins
    pins_paginated = Pin.query\
        .join(Like, Pin.id == Like.pin_id)\
        .filter(Like.user_id == user_id)\
        .order_by(desc(Like.created_at))\
        .paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
    
    return jsonify({
        'pins': [pin.to_dict() for pin in pins_paginated.items],
        'page': page,
        'pages': pins_paginated.pages,
        'per_page': per_page,
        'total': pins_paginated.total,
        'has_next': pins_paginated.has_next,
        'has_prev': pins_paginated.has_prev
    })