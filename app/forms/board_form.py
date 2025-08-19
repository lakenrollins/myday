from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, BooleanField
from wtforms.validators import DataRequired, Length, Optional

class BoardForm(FlaskForm):
    name = StringField('Board Name', validators=[DataRequired(), Length(min=1, max=100)])
    description = TextAreaField('Description', validators=[Optional(), Length(max=500)])
    is_private = BooleanField('Private Board', default=False)