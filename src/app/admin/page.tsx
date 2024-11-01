'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    // Replace 'your-chosen-password' with a password you choose
    if (password === 'your-chosen-password') {
      setIsAuthorized(true);
    }
  };

  const downloadData = async () => {
    try {
      const response = await fetch('/api/save-results');
      const result = await response.json();
      
      if (result.success) {
        // Create downloadable file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], 
          { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cognitive_task_data_${new Date().toISOString()}.json`;
        a.click();
      }
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>Admin Login</CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter password"
              />
              <Button type="submit">Login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>Download Data</CardHeader>
        <CardContent>
          <Button onClick={downloadData}>
            Download All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}