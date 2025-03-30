function checkSlots() {
    document.getElementById("slot-info").innerHTML = "Fetching available slots...";
    
    fetch("/available-slots") 
        .then(response => response.json())
        .then(data => {
            document.getElementById("slot-info").innerHTML = `Available slots: ${data.availableSlots}/${data.totalSlots}`;
        })
        .catch(error => {
            console.error("❌ Error fetching available slots:", error);
            document.getElementById("slot-info").innerHTML = "Error fetching slots!";
        });
}
function bookSlot() {
    window.location.href = "/parking-slot";
}   