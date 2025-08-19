from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, IntegerField, URLField
from wtforms.validators import DataRequired, Length, Optional, URL

class PinForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(min=1, max=255)])
    description = TextAreaField('Description', validators=[Optional(), Length(max=1000)])
    image_url = URLField('Image URL', validators=[DataRequired(), URL()])
    link = URLField('Link', validators=[Optional(), URL()])
    board_id = IntegerField('Board ID', validators=[Optional()])