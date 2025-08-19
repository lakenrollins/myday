import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useModal } from '../../context/Modal';
import { boardsApi } from '../../utils/api';
import styles from './CreateBoardModal.module.css';

export const CreateBoardModal = ({ onBoardCreated }) => {
  const dispatch = useDispatch();
  const { closeModal } = useModal();
  const user = useSelector(state => state.session.user);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Board name is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    try {
      const boardData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_private: formData.is_private
      };
      
      const newBoard = await boardsApi.createBoard(boardData);
      
      if (onBoardCreated) {
        onBoardCreated(newBoard);
      }
      
      closeModal();
    } catch (error) {
      console.error('Failed to create board:', error);
      setErrors({ submit: 'Failed to create board. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.modal}>
        <div className={styles.content}>
          <h2>Please log in to create boards</h2>
          <button onClick={closeModal} className={styles.closeButton}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>Create board</h2>
          <button onClick={closeModal} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder='Like "Places to go" or "Recipes to try"'
              className={`${styles.input} ${errors.name ? styles.error : ''}`}
              maxLength={100}
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What's your board about?"
              rows={3}
              className={styles.textarea}
              maxLength={500}
            />
          </div>

          <div className={styles.visibilitySection}>
            <h3 className={styles.sectionTitle}>Visibility</h3>
            <div className={styles.visibilityOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="is_private"
                  value={false}
                  checked={!formData.is_private}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_private: false }))}
                  className={styles.radio}
                />
                <div className={styles.radioContent}>
                  <div className={styles.radioHeader}>
                    <span className={styles.radioTitle}>Public</span>
                    <span className={styles.visibilityIcon}>🌍</span>
                  </div>
                  <p className={styles.radioDescription}>
                    Anyone on Pinterest can see this board
                  </p>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="is_private"
                  value={true}
                  checked={formData.is_private}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_private: true }))}
                  className={styles.radio}
                />
                <div className={styles.radioContent}>
                  <div className={styles.radioHeader}>
                    <span className={styles.radioTitle}>Secret</span>
                    <span className={styles.visibilityIcon}>🔒</span>
                  </div>
                  <p className={styles.radioDescription}>
                    Only you and collaborators can see this board
                  </p>
                </div>
              </label>
            </div>
          </div>

          {errors.submit && (
            <div className={styles.submitError}>{errors.submit}</div>
          )}

          <div className={styles.actions}>
            <button 
              type="button" 
              onClick={closeModal}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.createButton}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;