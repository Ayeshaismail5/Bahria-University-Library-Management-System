import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import bookRequestService, { BookRequest } from "@/services/bookRequest.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { format } from "date-fns";

const BookRequests = () => {
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await bookRequestService.getPendingRequests();
      setRequests(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReviewDialog = (request: BookRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setShowReviewDialog(true);
  };

  const handleReview = async () => {
    try {
      if (!selectedRequest) return;

      if (reviewAction === 'approve') {
        await bookRequestService.approveRequest(selectedRequest.id, reviewNote);
        toast({
          title: "Request Approved",
          description: "Book has been issued to the student",
        });
      } else {
        await bookRequestService.rejectRequest(selectedRequest.id, reviewNote);
        toast({
          title: "Request Rejected",
          description: "Student has been notified",
        });
      }

      setShowReviewDialog(false);
      setReviewNote("");
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated userRole="admin" userName="Admin" />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Book Requests</h1>
              <p className="text-muted-foreground mt-2">
                Review and approve student requests for borrowing a 3rd book
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading requests...</div>
            ) : requests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending requests
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{request.bookTitle}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            by {request.bookAuthor} • {request.bookCategory}
                          </p>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Student:</span>
                            <span>{request.userName} ({request.studentid})</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Current Borrows:</span>
                            <span className="text-destructive font-medium">{request.currentBorrows} books</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Requested:</span>
                            <span>{format(new Date(request.requestDate), "MMM dd, yyyy HH:mm")}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Book Available:</span>
                            <span className={request.bookAvailable > 0 ? "text-accent" : "text-destructive"}>
                              {request.bookAvailable > 0 ? `${request.bookAvailable} copies` : 'Not available'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Student's Request Note:</Label>
                          <div className="bg-muted p-3 rounded-md text-sm">
                            {request.requestNote || "No note provided"}
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenReviewDialog(request, 'reject')}
                          >
                            Reject Request
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenReviewDialog(request, 'approve')}
                            disabled={request.bookAvailable === 0}
                          >
                            Approve & Issue Book
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? `Approve ${selectedRequest?.userName}'s request to borrow "${selectedRequest?.bookTitle}"?`
                : `Reject ${selectedRequest?.userName}'s request for "${selectedRequest?.bookTitle}"?`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reviewNote">Review Note (Optional)</Label>
              <Textarea
                id="reviewNote"
                placeholder="Add a note for the student..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => {
              setShowReviewDialog(false);
              setReviewNote("");
              setSelectedRequest(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
            >
              {reviewAction === 'approve' ? 'Approve & Issue' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookRequests;
