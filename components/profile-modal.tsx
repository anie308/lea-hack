"use client"

import { useState, useEffect } from "react"
import { X, Upload, User } from "lucide-react"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { uploadProfileAvatar } from '@/lib/cloudinary'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
  currentProfile?: {
    name: string | null
    avatar_url: string | null
    bio: string | null
  }
  onUpdate: () => void
}

export function ProfileModal({ isOpen, onClose, walletAddress, currentProfile, onUpdate }: ProfileModalProps) {
  const [name, setName] = useState(currentProfile?.name || "")
  const [bio, setBio] = useState(currentProfile?.bio || "")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>(currentProfile?.avatar_url || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.name || "")
      setBio(currentProfile.bio || "")
      setAvatarPreview(currentProfile.avatar_url || "")
    }
  }, [currentProfile])

  if (!isOpen) return null

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let avatarUrl = currentProfile?.avatar_url || null

      // Upload avatar if a new file was selected
      if (avatarFile) {
        try {
          avatarUrl = await uploadProfileAvatar(avatarFile, walletAddress)
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError)
          toast.error('Avatar Upload Failed', {
            description: 'Failed to upload avatar. Profile will be updated without new avatar.',
          })
        }
      }

      // Upsert profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          wallet_address: walletAddress,
          name: name.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'wallet_address'
        })

      if (error) {
        throw error
      }

      toast.success('Profile Updated', {
        description: 'Your profile has been updated successfully.',
      })

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Update Failed', {
        description: 'Failed to update profile. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Update Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full border-2 border-border overflow-hidden bg-muted">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-border hover:border-primary rounded-lg transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-semibold">Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-3">
            <label htmlFor="name" className="block text-sm font-semibold">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
              disabled={isSubmitting}
            />
          </div>

          {/* Bio */}
          <div className="space-y-3">
            <label htmlFor="bio" className="block text-sm font-semibold">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Wallet Address (Read-only) */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Wallet Address</label>
            <div className="px-4 py-3 rounded-lg border-2 border-border bg-muted/30 text-muted-foreground font-mono text-sm">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border-2 border-border hover:border-primary text-foreground font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold rounded-lg transition"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

