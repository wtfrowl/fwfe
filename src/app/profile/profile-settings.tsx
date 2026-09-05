import { useState, useEffect, useContext, useCallback } from "react";
import { Sidebar, type ProfileTab } from "./components/Sidebar";
import { ProfileForm } from "./components/ProfileForm";
import { PasswordForm } from "./components/PasswordForm";
import { NotificationSettings } from "./components/NotificationSettings";
import { useDriverTracking } from "../../utils/location";
import { changePassword, getDriverProfile, getOwnerProfile, updateProfile } from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { StatusBadge } from "../../components/ui/StatusBadge";

interface ProfileData {
  _id?: string;
  firstName: string;
  lastName: string;
  age: number;
  contactNumber: string;
  street: string;
  city: string;
  state: string;
  role?: string;
  totalTrucks?: number;
}

export default function ProfileSettings() {
  const { isTracking, startTracking, stopTracking } = useDriverTracking();
  const { user, role } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* Feedback used to be four `alert()` calls. Inline status keeps the user in
     the page and lets success fade out on its own instead of demanding a
     click to dismiss. */
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const isDriver = role === "driver";

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);

      // Wait for auth to restore after a refresh.
      if (!user || !role) {
        setIsLoading(false);
        return;
      }

      try {
        const response = (await (isDriver
          ? getDriverProfile()
          : getOwnerProfile())) as unknown as ProfileData;
        setProfileData(response);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Could not load your profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user, role, isDriver]);

  /* Auto-dismiss success; keep errors until the next attempt. */
  useEffect(() => {
    if (status?.tone !== "success") return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const handleProfileUpdate = useCallback(
    async (data: ProfileData) => {
      /* `role` is nullable while auth restores. The previous version typed the
         whole context as `any` to get past this; guarding is the honest fix. */
      if (!role) return;
      setSaving(true);
      setStatus(null);
      try {
        const response = (await updateProfile(role, {
          firstName: data.firstName,
          lastName: data.lastName,
          age: data.age,
          street: data.street,
          city: data.city,
          state: data.state,
        })) as unknown as ProfileData;
        setProfileData(response);
        setStatus({ tone: "success", text: "Profile updated." });
      } catch (err) {
        console.error("Error updating profile:", err);
        setStatus({ tone: "error", text: "Could not update your profile. Please try again." });
      } finally {
        setSaving(false);
      }
    },
    [role]
  );

  const handlePasswordUpdate = useCallback(
    async (data: { currentPassword: string; newPassword: string }) => {
      if (!role) return;
      setSaving(true);
      setStatus(null);
      try {
        await changePassword(role, data);
        setStatus({ tone: "success", text: "Password updated." });
      } catch (err) {
        console.error("Error updating password:", err);
        setStatus({
          tone: "error",
          text: "Could not update your password. Check your current password and try again.",
        });
      } finally {
        setSaving(false);
      }
    },
    [role]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Account settings" description="Your details, password and shift status." />

      <div className="flex flex-col gap-5 md:flex-row">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} showShift={isDriver} />

        <div className="min-w-0 flex-1 rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)] md:p-6">
          {isLoading ? (
            <LoadingState label="Loading your profile" />
          ) : error ? (
            <InlineMessage tone="error">{error}</InlineMessage>
          ) : (
            <div className="space-y-4">
              <InlineMessage tone={status?.tone === "error" ? "error" : "success"}>
                {status?.text}
              </InlineMessage>

              {activeTab === "profile" &&
                (profileData ? (
                  <ProfileForm
                    initialData={profileData}
                    onSubmit={handleProfileUpdate}
                    saving={saving}
                  />
                ) : (
                  <p className="text-sm text-ink-secondary">
                    We couldn't find your profile details.
                  </p>
                ))}

              {activeTab === "password" && (
                <PasswordForm onSubmit={handlePasswordUpdate} saving={saving} />
              )}

              {activeTab === "notifications" && <NotificationSettings />}

              {activeTab === "shift" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4 rounded-card border border-hairline bg-canvas-sunken p-4">
                    <div>
                      <p className="font-semibold text-ink">Location tracking</p>
                      <p className="text-sm text-ink-secondary">
                        Share your location while you're on a trip.
                      </p>
                    </div>
                    <StatusBadge tone={isTracking ? "success" : "neutral"}>
                      {isTracking ? "On air" : "Off duty"}
                    </StatusBadge>
                  </div>

                  {/* These were two raw `<button style={{...}}>` elements with
                      inline hex colours — leftover debug controls that shipped
                      to drivers. */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={startTracking} disabled={isTracking}>
                      Start shift
                    </Button>
                    <Button variant="secondary" onClick={stopTracking} disabled={!isTracking}>
                      End shift
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
