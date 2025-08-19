from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db, Board, Pin, BoardFollower
from app.forms import BoardForm
from sqlalchemy import desc

board_routes = Blueprint('boards', __name__)

@board_routes.route('', strict_slashes=False)
@login_required
def get_user_boards():
    """Get current user's boards"""
    boards = Board.query.filter_by(user_id=current_user.id)\
        .order_by(desc(Board.created_at)).all()
    
    return jsonify({
        'boards': [board.to_dict(include_stats=True) for board in boards]
    })

@board_routes.route('/<int:board_id>')
def get_board(board_id):
    """Get a specific board"""
    board = Board.query.get(board_id)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    # Check if board is private and user doesn't own it
    if board.is_private and (not current_user.is_authenticated or board.user_id != current_user.id):
        return jsonify({'error': 'Board is private'}), 403
    
    return jsonify(board.to_dict(include_stats=True, include_pins=True))

@board_routes.route('', methods=['POST'], strict_slashes=False)
@login_required
def create_board():
    """Create a new board"""
    form = BoardForm()
    form.csrf_token.data = request.cookies.get('csrf_token')
    
    if form.validate_on_submit():
        board = Board(
            name=form.name.data,
            description=form.description.data,
            is_private=form.is_private.data,
            user_id=current_user.id
        )
        
        db.session.add(board)
        db.session.commit()
        
        return jsonify(board.to_dict(include_stats=True)), 201
    
    return jsonify({'errors': form.errors}), 400

@board_routes.route('/<int:board_id>', methods=['PUT'])
@login_required
def update_board(board_id):
    """Update a board"""
    board = Board.query.get(board_id)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    if board.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    form = BoardForm()
    form.csrf_token.data = request.cookies.get('csrf_token')
    
    if form.validate_on_submit():
        board.name = form.name.data
        board.description = form.description.data
        board.is_private = form.is_private.data
        
        db.session.commit()
        
        return jsonify(board.to_dict(include_stats=True))
    
    return jsonify({'errors': form.errors}), 400

@board_routes.route('/<int:board_id>', methods=['DELETE'])
@login_required
def delete_board(board_id):
    """Delete a board"""
    board = Board.query.get(board_id)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    if board.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(board)
    db.session.commit()
    
    return jsonify({'message': 'Board deleted successfully'})

@board_routes.route('/<int:board_id>/pins')
def get_board_pins(board_id):
    """Get all pins in a board"""
    board = Board.query.get(board_id)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    # Check if board is private and user doesn't own it
    if board.is_private and (not current_user.is_authenticated or board.user_id != current_user.id):
        return jsonify({'error': 'Board is private'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pins_paginated = Pin.query.filter_by(board_id=board_id)\
        .order_by(desc(Pin.created_at))\
        .paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
    
    return jsonify({
        'pins': [pin.to_dict() for pin in pins_paginated.items],
        'board': board.to_dict(include_stats=True),
        'page': page,
        'pages': pins_paginated.pages,
        'per_page': per_page,
        'total': pins_paginated.total,
        'has_next': pins_paginated.has_next,
        'has_prev': pins_paginated.has_prev
    })

@board_routes.route('/<int:board_id>/follow', methods=['POST'])
@login_required
def follow_board(board_id):
    """Follow or unfollow a board"""
    board = Board.query.get(board_id)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    if board.is_private:
        return jsonify({'error': 'Cannot follow private board'}), 403
    
    if board.user_id == current_user.id:
        return jsonify({'error': 'Cannot follow your own board'}), 400
    
    existing_follow = BoardFollower.query.filter_by(
        user_id=current_user.id,
        board_id=board_id
    ).first()
    
    if existing_follow:
        # Unfollow the board
        db.session.delete(existing_follow)
        following = False
    else:
        # Follow the board
        follow = BoardFollower(user_id=current_user.id, board_id=board_id)
        db.session.add(follow)
        following = True
    
    db.session.commit()
    
    return jsonify({
        'following': following,
        'followers_count': len(board.followers)
    })

@board_routes.route('/user/<int:user_id>')
def get_user_boards_public(user_id):
    """Get public boards by a specific user"""
    boards = Board.query.filter_by(user_id=user_id, is_private=False)\
        .order_by(desc(Board.created_at)).all()
    
    return jsonify({
        'boards': [board.to_dict(include_stats=True) for board in boards]
    })

@board_routes.route('/following')
@login_required
def get_followed_boards():
    """Get boards followed by current user"""
    followed_boards = db.session.query(Board)\
        .join(BoardFollower, Board.id == BoardFollower.board_id)\
        .filter(BoardFollower.user_id == current_user.id)\
        .order_by(desc(BoardFollower.created_at)).all()
    
    return jsonify({
        'boards': [board.to_dict(include_stats=True) for board in followed_boards]
    })