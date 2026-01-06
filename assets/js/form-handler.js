// Form Handler for APGI Framework
// Handles newsletter signup and email capture forms

class FormHandler {
  constructor() {
    this.apiEndpoint = 'https://api.apgiframework.com/v1/forms'; // Placeholder API endpoint
    this.init();
  }

  init() {
    // Handle newsletter signup (Home.html)
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
      emailForm.addEventListener('submit', this.handleEmailSubmit.bind(this));
    }

    // Handle book chapter request (Book-Outline.html)
    const subscriptionForms = document.querySelectorAll('.subscription-form');
    subscriptionForms.forEach(form => {
      form.addEventListener('submit', this.handleSubscriptionSubmit.bind(this));
    });

    // Handle any form with data-form-handler attribute
    const dynamicForms = document.querySelectorAll('[data-form-handler]');
    dynamicForms.forEach(form => {
      form.addEventListener('submit', this.handleDynamicSubmit.bind(this));
    });
  }

  async handleEmailSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {
      type: 'newsletter',
      name: formData.get('fname') || '',
      email: formData.get('email'),
      source: 'Home.html',
      timestamp: new Date().toISOString()
    };

    await this.submitForm(data, form);
  }

  async handleSubscriptionSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    if (!emailInput) return;

    const data = {
      type: 'book_chapter',
      email: emailInput.value,
      source: 'Book-Outline.html',
      timestamp: new Date().toISOString()
    };

    await this.submitForm(data, form);
  }

  async handleDynamicSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const formType = form.dataset.formHandler || 'contact';

    const data = {
      type: formType,
      ...Object.fromEntries(formData.entries()),
      source: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    await this.submitForm(data, form);
  }

  async submitForm(data, form) {
    try {
      // Show loading state
      this.setLoadingState(form, true);

      // For now, store in localStorage as fallback
      this.storeSubmission(data);

      // Try to submit to API (will fail in development but shows proper implementation)
      try {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        this.showSuccess(form, 'Thank you! Your submission has been received.');
      } catch (apiError) {
        // Fallback to localStorage submission
        // API unavailable, using localStorage fallback
        this.showSuccess(form, 'Thank you! Your submission has been saved locally.');
      }
    } catch (error) {
      // Form submission error - silent fail
      this.showError(form, 'Sorry, there was an error. Please try again.');
    } finally {
      this.setLoadingState(form, false);
    }
  }

  storeSubmission(data) {
    const submissions = JSON.parse(localStorage.getItem('apgi_form_submissions') || '[]');
    submissions.push(data);
    localStorage.setItem('apgi_form_submissions', JSON.stringify(submissions));
  }

  setLoadingState(form, isLoading) {
    const submitButton = form.querySelector('button[type="submit"], button');
    if (!submitButton) return;

    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      submitButton.style.opacity = '0.7';
    } else {
      submitButton.disabled = false;
      submitButton.textContent = submitButton.dataset.originalText || submitButton.textContent;
      submitButton.style.opacity = '1';
    }
  }

  showSuccess(form, message) {
    this.showMessage(form, message, 'success');
    if (form.tagName === 'FORM') {
      form.reset();
    }
  }

  showError(form, message) {
    this.showMessage(form, message, 'error');
  }

  showMessage(form, message, type) {
    // Remove existing messages
    const existingMessage = form.parentNode.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
            margin-top: 10px;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            ${
              type === 'success'
                ? 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
                : 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
        `;

    // Insert message after form
    form.parentNode.insertBefore(messageEl, form.nextSibling);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 5000);
  }
}

// Initialize form handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new FormHandler();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormHandler;
}
