import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { LocationPicker } from "@/components/maps/GoogleMap";
import { useCreatePickup } from "@/hooks/queries/useMember";
import { useAuthStore } from "@/store/auth.store";
import { ArrowLeft, MapPin, Camera, Calendar, Package, Info } from "lucide-react";

const WASTE_TYPES = [
  { value: "plastic", label: "Plastic" },
  { value: "paper", label: "Paper / Cardboard" },
  { value: "metal", label: "Metal / Aluminum" },
  { value: "glass", label: "Glass" },
  { value: "organic", label: "Organic / Food Waste" },
  { value: "ewaste", label: "E-Waste / Electronics" },
  { value: "textile", label: "Textile / Clothes" },
  { value: "mixed", label: "Mixed Waste" },
];

export default function NewPickupPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const create = useCreatePickup();

  const [wasteType, setWasteType] = useState("plastic");
  const [estimatedWeight, setEstimatedWeight] = useState("");
  const [address, setAddress] = useState(user?.address || "");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [location, setLocation] = useState(null);

  // Minimum date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const handleLocationSelect = (coords) => {
    setLocation(coords);
  };

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("wasteType", wasteType);
    fd.append("estimatedWeight", estimatedWeight);
    fd.append("address", address);
    fd.append("scheduledDate", `${scheduledDate}T${scheduledTime}:00`);
    if (notes) fd.append("notes", notes);
    if (location) {
      fd.append("latitude", location.lat);
      fd.append("longitude", location.lng);
    }
    if (imageFile) fd.append("memberImage", imageFile, "proof.jpg");

    create.mutate(fd, {
      onSuccess: () => navigate("/member/pickups"),
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/member/pickups" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Pickups
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Request Pickup"
        description="Schedule a waste collection at your convenience"
      />

      <form onSubmit={submit} className="space-y-6">
        {/* Waste Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Waste Details
            </CardTitle>
            <CardDescription>Tell us what you need collected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="wasteType">Waste Category *</Label>
                <select
                  id="wasteType"
                  className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                  value={wasteType}
                  onChange={(e) => setWasteType(e.target.value)}
                  required
                >
                  {WASTE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="weight">Estimated Weight (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  max="1000"
                  required
                  placeholder="e.g. 5.5"
                  value={estimatedWeight}
                  onChange={(e) => setEstimatedWeight(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <textarea
                id="notes"
                rows={2}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background resize-none"
                placeholder="Any special instructions? e.g. 'Bags are kept at the entrance'"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Schedule
            </CardTitle>
            <CardDescription>Choose a date and time window</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Pickup Date *</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  min={minDateStr}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Preferred Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Pickups are subject to supervisor approval and agent availability. You will be notified once assigned.</span>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Pickup Location
            </CardTitle>
            <CardDescription>Enter your address or pin it on the map</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                required
                placeholder="House No., Street, Area, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pin exact location on map (optional)</Label>
              <LocationPicker value={location} onChange={handleLocationSelect} height={240} />
              {location && (
                <p className="text-xs text-primary font-medium">
                  ✓ Location pinned: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photo Proof */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" /> Waste Photo
            </CardTitle>
            <CardDescription>Take a photo of your waste (recommended)</CardDescription>
          </CardHeader>
          <CardContent>
            <CameraCapture onCapture={(blob) => setImageFile(blob)} />
            {imageFile && (
              <p className="text-xs text-green-600 font-medium mt-2">✓ Photo captured and ready to upload</p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={create.isPending} className="flex-1 h-12">
            {create.isPending ? "Submitting request..." : "Submit Pickup Request"}
          </Button>
          <Button type="button" variant="outline" asChild className="h-12">
            <Link to="/member/pickups">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
