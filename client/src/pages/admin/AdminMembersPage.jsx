import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { membershipApi } from "@/api/membership.api";
import { parseApiError } from "@/api/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Box, QrCode, Search, RefreshCw } from "lucide-react";

export default function AdminMembersPage() {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQrImage, setSelectedQrImage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const { data } = await membershipApi.getAdminMemberships();
      if (data.success) {
        setMemberships(data.data || []);
      }
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    membershipApi.getAdminMemberships().then(({ data }) => {
      if (isMounted && data?.success) setMemberships(data.data || []);
    }).catch((err) => {
      if (isMounted) toast.error(parseApiError(err));
    }).finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const handleUpdateToolkit = async (id, deliveryStatus) => {
    setUpdatingId(id);
    try {
      const { data } = await membershipApi.updateAdminToolkitStatus(id, {
        deliveryStatus,
        delivered: deliveryStatus === "delivered",
      });
      if (data.success) {
        toast.success("Toolkit status updated to " + deliveryStatus);
        fetchMemberships();
      }
    } catch (err) {
      toast.error(parseApiError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRegenerateQR = async (userId) => {
    try {
      const { data } = await membershipApi.regenerateUserQR(userId);
      if (data.success) {
        toast.success("New QR generated!");
        fetchMemberships();
      }
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const filtered = memberships.filter((m) => {
    const user = m.user || {};
    const query = search.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      m.binSize?.toLowerCase().includes(query) ||
      m.qrCode?.qrCodeId?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Helmet>
        <title>Manage Permanent Members & Toolkits | EcoXchange Admin</title>
      </Helmet>

      <div className="space-y-6">
        <PageHeader
          title="Permanent Members & Toolkit Logistics"
          description="Track member upgrade payments, dustbin sizes, toolkit delivery, and digital QR identity cards"
          actions={
            <Button size="sm" variant="outline" onClick={fetchMemberships}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          }
        />

        {/* Toolkit & QR Management Section */}
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Box className="h-5 w-5 text-emerald-600" /> Toolkit Allocation & QR Registry
                </CardTitle>
                <CardDescription>
                  Manage hardware dispatch (3 bins + 100 covers + 100 stickers) and user identity QR codes
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter members or QR..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-40 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No permanent membership purchase records found.
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border-b">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Bin Size</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Toolkit Status</th>
                      <th className="p-3">QR Identity</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((m) => {
                      const user = m.user || {};
                      const toolkit = m.toolkit;
                      const qr = m.qrCode;
                      return (
                        <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-medium">
                            <p className="font-semibold text-slate-900 dark:text-white">{user.fullName || "User"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize font-bold">
                              {m.binSize}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-emerald-600">₹{m.amount}</span>
                            <span className="text-xs block text-muted-foreground capitalize">{m.paymentStatus}</span>
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`capitalize text-[10px] ${
                                toolkit?.deliveryStatus === "delivered"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                              variant="outline"
                            >
                              {toolkit?.deliveryStatus || "processing"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {qr?.qrCodeId ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {qr.qrCodeId}
                                </span>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-6 px-1.5 text-emerald-600 hover:text-emerald-700"
                                  onClick={() => setSelectedQrImage(qr.qrImage)}
                                >
                                  <QrCode className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-1">
                            {toolkit?.deliveryStatus !== "delivered" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                disabled={updatingId === (toolkit?._id || user._id)}
                                onClick={() => handleUpdateToolkit(toolkit?._id || user._id, "delivered")}
                              >
                                Mark Delivered
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-slate-500 hover:text-slate-900"
                              onClick={() => handleRegenerateQR(user._id)}
                            >
                              Regen QR
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Preview Dialog */}
        <Dialog open={Boolean(selectedQrImage)} onOpenChange={(open) => { if (!open) setSelectedQrImage(null); }}>
          <DialogContent className="sm:max-w-xs text-center">
            <DialogHeader>
              <DialogTitle>Member QR Identity</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-white rounded-xl shadow-inner border mx-auto">
              {selectedQrImage && <img src={selectedQrImage} alt="QR Code Preview" className="w-56 h-56 object-contain" />}
            </div>
          </DialogContent>
        </Dialog>

        {/* Existing Member Table */}
        <AdminUsersTable roleFilter="member" emptyLabel="No permanent members found." />
      </div>
    </>
  );
}
