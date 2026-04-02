import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Download, Home, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReservationData {
  success: boolean;
  ticketId?: number;
  ticketCode?: string;
  purchaseId?: number;
  accessCode?: string;
  qrCode: string;
  eventTitle?: string;
  classTitle?: string;
  eventDate?: string | Date;
  classDate?: string | Date;
  venue?: string;
  price: string | number;
  paymentInstructions: string;
  itemType?: "event" | "class";
}

export default function ReservationConfirmation() {
  const [, setLocation] = useLocation();

  // Get reservation data from navigation state or sessionStorage
  const reservationData = (window.history.state?.reservationData ||
    JSON.parse(sessionStorage.getItem("reservationData") || "null")) as ReservationData | null;

  useEffect(() => {
    // Clear sessionStorage after displaying
    if (reservationData) {
      sessionStorage.setItem("reservationData", JSON.stringify(reservationData));
    }
  }, [reservationData]);

  if (!reservationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No reservation data found</p>
          <Button onClick={() => setLocation("/")}>
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const itemTitle = reservationData.eventTitle || reservationData.classTitle || "Event/Class";
  const itemDate = reservationData.eventDate || reservationData.classDate;
  const formattedDate = itemDate ? new Date(itemDate).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) : "";

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = reservationData.qrCode;
    link.download = `qr-code-${reservationData.ticketCode || reservationData.accessCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Spot Reserved!
          </h1>
          <p className="text-gray-600">
            Your reservation has been confirmed
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {/* Event/Class Info */}
          <div className="bg-gradient-to-r from-pink-500 to-red-500 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">{itemTitle}</h2>
            {formattedDate && (
              <div className="flex items-center gap-2 text-pink-100">
                <Calendar className="h-4 w-4" />
                <p>{formattedDate}</p>
              </div>
            )}
            {reservationData.venue && (
              <p className="text-pink-100 mt-1">📍 {reservationData.venue}</p>
            )}
          </div>

          {/* QR Code */}
          <div className="p-8 bg-gray-50">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Your Check-In QR Code
              </p>
              <div className="bg-white p-6 rounded-xl shadow-md inline-block border-4 border-pink-500">
                <img
                  src={reservationData.qrCode}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Show this QR code at the door for quick check-in
              </p>
              <Button
                onClick={handleDownloadQR}
                variant="outline"
                className="mt-4"
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="p-6 bg-yellow-50 border-t border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              ⚠️ Payment Required at Door
            </h3>
            <p className="text-yellow-800 text-sm mb-3">
              {reservationData.paymentInstructions}
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <p className="text-center font-bold text-yellow-900">
                Bring <span className="text-2xl">£{reservationData.price}</span> in cash
              </p>
            </div>
          </div>

          {/* Confirmation Code */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Confirmation Code
                </p>
                <p className="font-mono font-bold text-gray-900">
                  {reservationData.ticketCode || reservationData.accessCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Amount to Pay
                </p>
                <p className="font-bold text-pink-600 text-xl">
                  £{reservationData.price}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            📧 Email Sent
          </h3>
          <p className="text-blue-800 text-sm">
            We've sent a confirmation email with your QR code and reservation details. Check your inbox!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            size="lg"
          >
            <Calendar className="mr-2 h-4 w-4" />
            View My Bookings
          </Button>
          <Button
            onClick={() => setLocation("/")}
            size="lg"
            className="bg-gradient-to-r from-pink-500 to-red-500"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-2">💡 <strong>Pro Tips:</strong></p>
          <ul className="text-left max-w-md mx-auto space-y-1">
            <li>• Save the QR code to your phone for easy access</li>
            <li>• Arrive 10-15 minutes early to check in</li>
            <li>• Bring exact change if possible</li>
            <li>• Check your email for additional details</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
