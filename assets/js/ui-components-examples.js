/**
 * APGI UI Components - Usage Examples
 * Demonstrates how to use the UI component library
 */

// Example usage functions for the UI Components library

function demonstrateButtons() {
  const container = document.createElement("div");

  // Primary button
  const primaryBtn = window.UIComponents.createButton("Primary Action", {
    variant: "primary",
    onClick: () => alert("Primary button clicked!"),
  });

  // Secondary button
  const secondaryBtn = window.UIComponents.createButton("Secondary", {
    variant: "secondary",
    onClick: () => alert("Secondary button clicked!"),
  });

  // Success button
  const successBtn = window.UIComponents.createButton("Success", {
    variant: "success",
    onClick: () => alert("Success button clicked!"),
  });

  // Loading button
  const loadingBtn = window.UIComponents.createButton("Loading...", {
    variant: "primary",
    loading: true,
    disabled: true,
  });

  container.appendChild(primaryBtn);
  container.appendChild(document.createTextNode(" "));
  container.appendChild(secondaryBtn);
  container.appendChild(document.createTextNode(" "));
  container.appendChild(successBtn);
  container.appendChild(document.createTextNode(" "));
  container.appendChild(loadingBtn);

  return container;
}

function demonstrateForms() {
  const container = document.createElement("div");

  // Text input
  const textInput = window.UIComponents.createInput({
    type: "text",
    placeholder: "Enter your name",
    required: true,
  });
  const textGroup = window.UIComponents.createFormGroup(
    "Full Name",
    textInput,
    { required: true },
  );

  // Email input
  const emailInput = window.UIComponents.createInput({
    type: "email",
    placeholder: "your@email.com",
    required: true,
  });
  const emailGroup = window.UIComponents.createFormGroup(
    "Email Address",
    emailInput,
    { required: true },
  );

  // Select dropdown
  const selectInput = window.UIComponents.createSelect({
    placeholder: "Choose an option",
    options: [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
      { value: "option3", label: "Option 3" },
    ],
  });
  const selectGroup = window.UIComponents.createFormGroup(
    "Select Option",
    selectInput,
  );

  // Textarea
  const textareaInput = document.createElement("textarea");
  textareaInput.placeholder = "Enter your message here...";
  const textareaGroup = window.UIComponents.createFormGroup(
    "Message",
    textareaInput,
    {
      type: "textarea",
    },
  );

  container.appendChild(textGroup);
  container.appendChild(selectGroup);
  container.appendChild(textareaGroup);

  return container;
}

function demonstrateCards() {
  const container = document.createElement("div");
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fit, minmax(300px, 1fr))";
  container.style.gap = "20px";

  // Simple card
  const card1 = window.UIComponents.createCard(`
    <h3>Basic Card</h3>
    <p>This is a simple card with basic content.</p>
  `);

  // Card with title option
  const card2 = window.UIComponents.createCard(
    `
    <p>This card uses the title option in the constructor.</p>
  `,
    {
      title: "Advanced Card",
    },
  );

  // Card with custom content
  const card3Content = document.createElement("div");
  card3Content.innerHTML = `
    <h4>Interactive Card</h4>
    <p>Click the button below!</p>
  `;
  const actionBtn = window.UIComponents.createButton("Click Me", {
    variant: "primary",
    onClick: () => alert("Card button clicked!"),
  });
  card3Content.appendChild(actionBtn);

  const card3 = window.UIComponents.createCard(card3Content, {
    title: "Interactive Example",
  });

  container.appendChild(card1);
  container.appendChild(card2);
  container.appendChild(card3);

  return container;
}

function demonstrateModal() {
  const triggerBtn = window.UIComponents.createButton("Open Modal", {
    variant: "primary",
  });

  const modalContent = `
    <h3>Modal Content</h3>
    <p>This is a modal dialog created with the UI Components library.</p>
    <p>You can add any content here, including forms, images, or complex layouts.</p>
  `;

  const modal = window.UIComponents.createModal("Example Modal", modalContent, {
    id: "example-modal",
    footer: [
      window.UIComponents.createButton("Cancel", {
        variant: "secondary",
        onClick: () => window.UIComponents.closeModal(modal),
      }),
      window.UIComponents.createButton("Confirm", {
        variant: "primary",
        onClick: () => {
          alert("Modal confirmed!");
          window.UIComponents.closeModal(modal);
        },
      }),
    ],
  });

  triggerBtn.addEventListener("click", () => {
    window.UIComponents.openModal(modal);
  });

  // Add modal to body (hidden by default)
  document.body.appendChild(modal);

  return triggerBtn;
}

function demonstrateAlerts() {
  const container = document.createElement("div");

  // Success alert
  const successAlert = window.UIComponents.createAlert(
    "Operation completed successfully!",
    "success",
    { dismissible: true },
  );

  // Warning alert
  const warningAlert = window.UIComponents.createAlert(
    "Please review your input before proceeding.",
    "warning",
    { dismissible: true },
  );

  // Error alert
  const errorAlert = window.UIComponents.createAlert(
    "An error occurred while processing your request.",
    "danger",
    { dismissible: true },
  );

  // Info alert with auto-close
  const infoAlert = window.UIComponents.createAlert(
    "This message will automatically close in 5 seconds.",
    "info",
    { autoClose: 5000 },
  );

  container.appendChild(successAlert);
  container.appendChild(warningAlert);
  container.appendChild(errorAlert);
  container.appendChild(infoAlert);

  return container;
}

function demonstrateProgress() {
  const container = document.createElement("div");

  // Progress bar
  const progressBar = window.UIComponents.createProgressBar(30);

  // Button to update progress
  const updateBtn = window.UIComponents.createButton("Update Progress", {
    variant: "primary",
    onClick: () => {
      const currentProgress =
        parseInt(progressBar.querySelector(".apgi-progress-bar").style.width) ||
        30;
      const newProgress = (currentProgress + 10) % 110;
      progressBar.updateProgress(newProgress);
    },
  });

  container.appendChild(progressBar);
  container.appendChild(document.createElement("br"));
  container.appendChild(updateBtn);

  return container;
}

function demonstrateTabs() {
  const tabs = [
    {
      label: "Overview",
      content: `
        <h3>Overview Tab</h3>
        <p>This is the overview content. You can put any HTML content here.</p>
        <ul>
          <li>Feature 1</li>
          <li>Feature 2</li>
          <li>Feature 3</li>
        </ul>
      `,
    },
    {
      label: "Settings",
      content: `
        <h3>Settings Tab</h3>
        <p>Configure your preferences here.</p>
        <label>
          <input type="checkbox"> Enable notifications
        </label><br>
        <label>
          <input type="checkbox"> Auto-save
        </label>
      `,
    },
    {
      label: "Advanced",
      content: `
        <h3>Advanced Tab</h3>
        <p>Advanced configuration options.</p>
        <details>
          <summary>Advanced Options</summary>
          <p>Hidden advanced content here...</p>
        </details>
      `,
    },
  ];

  return window.UIComponents.createTabs(tabs);
}

// Demo initialization function
function initializeComponentDemo() {
  const demoContainer = document.getElementById("component-demo");
  if (!demoContainer) return;

  demoContainer.innerHTML = "";

  // Add sections for each component type
  const sections = [
    { title: "Buttons", content: demonstrateButtons() },
    { title: "Forms", content: demonstrateForms() },
    { title: "Cards", content: demonstrateCards() },
    { title: "Modal", content: demonstrateModal() },
    { title: "Alerts", content: demonstrateAlerts() },
    { title: "Progress", content: demonstrateProgress() },
    { title: "Tabs", content: demonstrateTabs() },
  ];

  sections.forEach((section) => {
    const sectionEl = document.createElement("div");
    sectionEl.style.marginBottom = "40px";

    const title = document.createElement("h2");
    title.textContent = section.title;
    title.style.marginBottom = "20px";

    sectionEl.appendChild(title);
    sectionEl.appendChild(section.content);
    demoContainer.appendChild(sectionEl);
  });
}

// Auto-initialize if demo container exists
document.addEventListener("DOMContentLoaded", () => {
  initializeComponentDemo();
});

// Export demo functions for external use
window.ComponentDemos = {
  demonstrateButtons,
  demonstrateForms,
  demonstrateCards,
  demonstrateModal,
  demonstrateAlerts,
  demonstrateProgress,
  demonstrateTabs,
  initializeComponentDemo,
};
