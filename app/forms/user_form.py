from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, URLField
from wtforms.validators import DataRequired, Length, Optional, URL

class UserUpdateForm(FlaskForm):
    first_name = StringField('First Name', validators=[DataRequired(), Length(min=1, max=50)])
    last_name = StringField('Last Name', validators=[DataRequired(), Length(min=1, max=50)])
    bio = TextAreaField('Bio', validators=[Optional(), Length(max=500)])
    website = URLField('Website', validators=[Optional(), URL()])
    location = StringField('Location', validators=[Optional(), Length(max=100)])
    avatar_url = URLField('Avatar URL', validators=[Optional(), URL()])