from flask_wtf import FlaskForm
from wtforms import TextAreaField
from wtforms.validators import DataRequired, Length

class CommentForm(FlaskForm):
    content = TextAreaField('Content', validators=[
        DataRequired(message='Comment content is required'),
        Length(min=1, max=500, message='Comment must be between 1 and 500 characters')
    ])