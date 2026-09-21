'use client';

import { useState } from 'react';
import { apiRequest } from '@/app/lib/api';

const initialState = {
  name: '',
  email: '',
  inquiryType: 'general',
  message: '',
};

export default function InquiryForm() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState({ type: 'idle', message: '' });

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) nextErrors.email = 'Please enter a valid email address.';
    }
    if (!form.inquiryType) nextErrors.inquiryType = 'Please select an inquiry type.';
    if (!form.message.trim()) nextErrors.message = 'Message is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ type: 'idle', message: '' });

    try {
      await apiRequest('/inquiries', {
        method: 'POST',
        body: form,
      });

      setSubmitState({
        type: 'success',
        message: 'Your inquiry has been sent successfully. We will be in touch soon.',
      });
      setForm(initialState);
      setErrors({});
    } catch (error) {
      setSubmitState({
        type: 'error',
        message: error.message || 'We could not submit your inquiry right now. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form inquiry-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid two-col">
        <label className="field">
          <span>Name</span>
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <small>{errors.name}</small>}
        </label>

        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <small>{errors.email}</small>}
        </label>
      </div>

      <label className="field">
        <span>Inquiry type</span>
        <select
          name="inquiryType"
          value={form.inquiryType}
          onChange={handleChange}
          className={errors.inquiryType ? 'error' : ''}
        >
          <option value="general">General</option>
          <option value="project">Project</option>
          <option value="partnership">Partnership</option>
          <option value="press">Press</option>
          <option value="careers">Careers</option>
        </select>
        {errors.inquiryType && <small>{errors.inquiryType}</small>}
      </label>

      <label className="field">
        <span>Message</span>
        <textarea
          name="message"
          rows="6"
          value={form.message}
          onChange={handleChange}
          placeholder="Tell us a little about your project or inquiry..."
          className={errors.message ? 'error' : ''}
        />
        {errors.message && <small>{errors.message}</small>}
      </label>

      {submitState.type !== 'idle' && (
        <p className={`form-message ${submitState.type === 'success' ? 'success' : 'error'}`}>
          {submitState.message}
        </p>
      )}

      <button type="submit" className="auth-button" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit inquiry'}
      </button>
    </form>
  );
}
