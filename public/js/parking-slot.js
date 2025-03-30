
    async function updateSlotTimes() {
        const slotElements = document.querySelectorAll(".slot");
    
        for (let slot of slotElements) {
            const slotNumber = slot.querySelector("span").innerText.trim();
            const timeLeftElement = document.getElementById(`time-left-${slotNumber}`);
    
            if (!timeLeftElement) continue; // Skip unbooked slots
    
            try {
                const response = await fetch("/check-slot", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ slotNumber })
                });
    
                const result = await response.json();
                if (result.success) {
                    timeLeftElement.innerHTML = `Available in <br> <div class="result-time">${result.timeLeft}</div>`;
                }
            } catch (error) {
                console.error(`Error updating slot ${slotNumber}:`, error);
            }
        }
    }
    // Update every 10 seconds automatically
    setInterval(updateSlotTimes, 10000);
    updateSlotTimes(); // Run once on page load

