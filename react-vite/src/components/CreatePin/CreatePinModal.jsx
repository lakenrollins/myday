import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useModal } from '../../context/Modal';
import { createPin } from '../../redux/pins';
import { boardsApi } from '../../utils/api';
import styles from './CreatePinModal.module.css';

export const CreatePinModal = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { closeModal } = useModal();
  const user = useSelector(state => state.session.user);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link: '',
    board_id: ''
  });
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const userBoards = await boardsApi.getUserBoards();
        setBoards(userBoards.boards || userBoards || []);
      } catch (error) {
        console.error('Failed to fetch boards:', error);
        setBoards([]);
      }
    };

    if (user) {
      fetchBoards();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.image_url.trim()) {
      newErrors.image_url = 'Image URL is required';
    } else {
      // Basic URL validation
      try {
        new URL(formData.image_url);
      } catch {
        newErrors.image_url = 'Please enter a valid URL';
      }
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
      const pinData = {
        ...formData,
        board_id: formData.board_id || null
      };
      
      await dispatch(createPin(pinData));
      
      if (onSuccess) {
        onSuccess();
      }
      closeModal();
    } catch (error) {
      console.error('Failed to create pin:', error);
      setErrors({ submit: 'Failed to create pin. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.modal}>
        <div className={styles.content}>
          <h2>Please log in to create pins</h2>
          <button onClick={closeModal} className={styles.closeButton}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>Create Pin</h2>
          <button onClick={closeModal} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.mainSection}>
            <div className={styles.imageSection}>
              <div className={styles.imageUpload}>
                {formData.image_url ? (
                  <img 
                    src={formData.image_url} 
                    alt="Pin preview" 
                    className={styles.previewImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <div className={styles.uploadIcon}>📷</div>
                    <p>Add your image URL below</p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.detailsSection}>
              <div className={styles.formGroup}>
                <label htmlFor="image_url" className={styles.label}>
                  Image URL *
                </label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className={`${styles.input} ${errors.image_url ? styles.error : ''}`}
                />
                {errors.image_url && (
                  <span className={styles.errorText}>{errors.image_url}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.label}>
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Add a title"
                  className={`${styles.input} ${errors.title ? styles.error : ''}`}
                />
                {errors.title && (
                  <span className={styles.errorText}>{errors.title}</span>
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
                  placeholder="Tell everyone what your Pin is about"
                  rows={3}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="link" className={styles.label}>
                  Destination Link
                </label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="Add a destination link"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="board_id" className={styles.label}>
                  Board
                </label>
                <select
                  id="board_id"
                  name="board_id"
                  value={formData.board_id}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Select a board (optional)</option>
                  {Array.isArray(boards) && boards.map(board => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
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
                  className={styles.saveButton}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Pin'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePinModal;