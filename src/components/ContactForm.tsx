import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, AlertCircle } from 'lucide-react'

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    privacy: false
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.privacy) return

    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', message: '', privacy: false })
      } else {
        setStatus('error')
        setErrorMessage(data.message || 'Something went wrong.')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage('Failed to send message. Please try again later.')
    }
  }

  return (
    <div className="w-full max-w-xl">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#1C1D20] text-white p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]"
          >
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-space-grotesk font-bold">Message sent!</h3>
            <p className="text-neutral-400 max-w-sm font-inter">
              Thanks for reaching out. I'll get back to you as soon as possible.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors font-inter text-sm"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-inter text-neutral-600 uppercase tracking-widest font-semibold">Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-neutral-100 border-none rounded-xl p-4 font-inter focus:ring-2 focus:ring-black/5 transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-inter text-neutral-600 uppercase tracking-widest font-semibold">Email</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-neutral-100 border-none rounded-xl p-4 font-inter focus:ring-2 focus:ring-black/5 transition-all outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-inter text-neutral-600 uppercase tracking-widest font-semibold">Message</label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-neutral-100 border-none rounded-xl p-4 font-inter focus:ring-2 focus:ring-black/5 transition-all outline-none resize-none cool-scrollbar"
                  placeholder="Tell me about your project..."
                />
              </div>

              <div className="flex items-start gap-3 pt-2">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="privacy"
                    required
                    checked={formData.privacy}
                    onChange={(e) => setFormData({ ...formData, privacy: e.target.checked })}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-neutral-300 bg-white checked:bg-black checked:border-black transition-all"
                  />
                  <Check className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <label htmlFor="privacy" className="text-sm text-neutral-500 font-inter cursor-pointer select-none leading-tight pt-0.5">
                  I agree to the <a href="/datenschutzerklaerung" target="_blank" className="text-black underline underline-offset-2 hover:opacity-70">Privacy Policy</a> and consent to having my data processed for the purpose of this inquiry.
                </label>
              </div>
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-inter">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting' || !formData.privacy}
              className="w-full bg-[#1C1D20] text-white py-4 rounded-xl font-space-grotesk font-bold text-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ContactForm
