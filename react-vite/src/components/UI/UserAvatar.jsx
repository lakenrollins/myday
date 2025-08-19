import styles from './UserAvatar.module.css';

export const UserAvatar = ({ 
  user, 
  size = 48, 
  className = '',
  onClick,
  ...props 
}) => {
  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user.username) {
      // If username has multiple words, take first letter of each
      const parts = user.username.split(/[\s_-]+/);
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size * 0.4}px`
  };

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.username || user.first_name || 'User'}
        className={`${styles.avatarImage} ${className}`}
        style={avatarStyle}
        onClick={onClick}
        onError={(e) => {
          // Replace with initials avatar on error
          const initialsDiv = document.createElement('div');
          initialsDiv.className = `${styles.avatarInitials} ${className}`;
          initialsDiv.style.cssText = `width: ${size}px; height: ${size}px; font-size: ${size * 0.4}px;`;
          initialsDiv.textContent = getInitials(user);
          if (onClick) initialsDiv.onclick = onClick;
          e.target.parentNode.replaceChild(initialsDiv, e.target);
        }}
        {...props}
      />
    );
  }

  return (
    <div
      className={`${styles.avatarInitials} ${className}`}
      style={avatarStyle}
      onClick={onClick}
      {...props}
    >
      {getInitials(user)}
    </div>
  );
};

export default UserAvatar;