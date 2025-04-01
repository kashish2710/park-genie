
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
                    timeLeftElement.innerHTML = `Available in <br> <div class="result-time">${result.timeLeft.replace(/\s*left$/, "")
                    }</div>`;
                }
            } catch (error) {
                console.error(`Error updating slot ${slotNumber}:`, error);
            }
        }
    }
    // Update every 10 seconds automatically
    setInterval(updateSlotTimes, 10000);
    updateSlotTimes(); // Run once on page load

    document.addEventListener("DOMContentLoaded", function() {
        let text = "ParkGenie-Your Parking Assistant";
        let index = 0;
        let typingElement = document.getElementById("typing");
        
        function typeEffect() {
            if (index < text.length) {
                typingElement.innerHTML += text.charAt(index);
                index++;
                setTimeout(typeEffect, 150);
            }
        }
        typeEffect();
    });

    function postComment() {
        let commentBox = document.getElementById("comment");
        let commentsSection = document.getElementById("comments");
        
        if (commentBox.value.trim() !== "") {
            let newComment = document.createElement("p");
            newComment.textContent = commentBox.value;
            newComment.style.animation = "fadeIn 0.5s ease-in-out";
            commentsSection.appendChild(newComment);
            commentBox.value = "";
        }
    }

    let stars = document.querySelectorAll(".stars span");
    let ratingText = document.getElementById("ratingText");
    let thankYouMessage = document.getElementById("thankYou");
    
    stars.forEach(star => {
        star.addEventListener("click", function() {
            let rating = this.getAttribute("data-value");
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add("active");
                } else {
                    s.classList.remove("active");
                }
            });
            ratingText.textContent = "You rated: " + rating + " stars";
            thankYouMessage.style.display = "block";
        });
    });

