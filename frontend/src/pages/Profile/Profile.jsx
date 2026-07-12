import { Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { RiUserLine, RiMailLine, RiHashtag, RiSettings3Line, RiLogoutBoxLine, RiBarChartLine } from "@remixicon/react";
import { ModeToggle } from "@/components/mode-toggle";

function Profile() {
  const { user, updateUser, authFetch, logout } = useAuth();
  const [pfp, setPfp] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentProfileImg, setCurrentProfileImg] = useState(
    user?.profileImg || null
  );

  // Sync user updates
  useEffect(() => {
    if (user?.profileImg && user.profileImg !== currentProfileImg) {
      setCurrentProfileImg(user.profileImg);
    }
  }, [user?.profileImg]);

  if (!user) return <Navigate to="/login" replace />;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPfp(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pfp) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("pfp", pfp);

    try {
      const resp = await authFetch("/api/user/uploadPfp", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) throw new Error("Upload failed.");
      const data = await resp.json();

      // Update avatar instantly
      setCurrentProfileImg(data.imageUrl);
      updateUser({ profileImg: data.imageUrl });

      setPfp(null);
      e.target.reset();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageContainer className="flex justify-center">
      <Card className="w-full max-w-xl shadow-xl border-border">
        <CardHeader className="pb-0 pt-6">
          <CardTitle className="text-center text-3xl font-bold text-blue-700 dark:text-blue-300">
            Your Profile
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-8">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4">
            <img
              className="w-40 h-40 rounded-full shadow-md object-cover border-2 border-blue-400 dark:border-blue-300"
              src={
                user?.profileImg
                  ? `${API_BASE_URL}/public/${user.profileImg}`
                  : `${API_BASE_URL}/public/default.jpg`
              }
              alt="Profile"
            />

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-center gap-3"
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="cursor-pointer"
              />

              <Button
                type="submit"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </div>

          {/* User Details */}
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <RiHashtag className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              <p className="text-lg">
                <span className="font-semibold">User ID:</span> {user.userId}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <RiUserLine className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              <p className="text-lg">
                <span className="font-semibold">Username:</span> {user.username}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <RiMailLine className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              <p className="text-lg">
                <span className="font-semibold">Email:</span> {user.email}
              </p>
            </div>

            <div className="pt-4">
              <Link to="/stats" className="w-full">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <RiBarChartLine className="w-5 h-5" />
                  View Your Stats
                </Button>
              </Link>
            </div>
          </div>

          <hr className="border-border" />

          {/* Settings Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <RiSettings3Line className="w-6 h-6 text-foreground" />
              <h3 className="text-xl font-semibold">Settings</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-muted-foreground">Theme</span>
              <ModeToggle />
            </div>

            <Button 
              variant="destructive" 
              className="w-full mt-4 flex items-center justify-center gap-2"
              onClick={logout}
            >
              <RiLogoutBoxLine className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export default Profile;
