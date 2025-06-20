import React from "react";

const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b">
      <button
        className={`flex-1 py-4 px-6 text-center font-medium ${
          activeTab === "monthly"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => setActiveTab("monthly")}
      >
        Monthly Summary Metrics
      </button>
      <button
        className={`flex-1 py-4 px-6 text-center font-medium ${
          activeTab === "tenant"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => setActiveTab("tenant")}
      >
        Tenant and Dealer Metrics
      </button>
      <button
        className={`flex-1 py-4 px-6 text-center font-medium ${
          activeTab === "specific"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => setActiveTab("specific")}
      >
        Specific Tenant/Dealer
      </button>
    </div>
  );
};

export default TabNavigation;
