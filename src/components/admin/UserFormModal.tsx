import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const userSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['employee', 'it_helpdesk'], {
    required_error: 'Please select a role',
  }),
  specialization: z.enum(['hardware', 'software', 'network', 'access', 'other']).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export interface UserModalUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'employee' | 'it_helpdesk';
  specialization?: 'hardware' | 'software' | 'network' | 'access' | 'other';
}

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: UserModalUser | null;
  onSuccess: () => void;
}

export function UserFormModal({ open, onClose, user, onSuccess }: UserFormModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'employee',
      specialization: undefined,
    },
  });

  const watchRole = form.watch('role');

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        password: '', // Don't populate password for editing
      });
    } else {
      form.reset({
        full_name: '',
        email: '',
        password: '',
        role: 'employee',
        specialization: undefined,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);

      if (user) {
        // Update existing user
        const updateData: any = {
          full_name: data.full_name,
          email: data.email,
          role: data.role,
        };

        if (data.role === 'it_helpdesk' && data.specialization) {
          updateData.specialization = data.specialization;
        } else {
          updateData.specialization = null;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user
        const redirectUrl = `${window.location.origin}/`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password!,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: data.full_name,
              role: data.role,
              specialization: data.role === 'it_helpdesk' ? data.specialization : null,
            }
          }
        });

        if (authError) throw authError;

        toast({
          title: "Success",
          description: "User created successfully. They will receive a confirmation email.",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update user information and role settings' : 'Create a new user account with role and permissions'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field}
                      disabled={!!user} // Disable email editing for existing users
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!user && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="it_helpdesk">IT Helpdesk</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchRole === 'it_helpdesk' && (
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="access">Access</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}