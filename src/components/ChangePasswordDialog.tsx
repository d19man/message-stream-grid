import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

interface ChangePasswordDialogProps {
  trigger?: React.ReactNode;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validasi password baru
    if (newPassword.length < 6) {
      setError('Password baru harus minimal 6 karakter');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      // Update password di Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Password Berhasil Diubah",
          description: "Password Anda telah berhasil diperbarui",
        });
        
        // Reset form dan tutup dialog
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOpen(false);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <KeyRound className="h-4 w-4 mr-2" />
      Ubah Password
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <span>Ubah Password</span>
          </DialogTitle>
          <DialogDescription>
            Masukkan password lama dan password baru Anda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="current-password">Password Saat Ini</Label>
            <Input
              id="current-password"
              type="password"
              placeholder="Masukkan password saat ini"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Password Baru</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Masukkan password baru (min. 6 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              className="bg-gradient-primary hover:bg-gradient-primary/90"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Mengubah...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ubah Password
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;