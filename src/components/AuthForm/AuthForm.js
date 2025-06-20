
import React, { useState, useEffect } from "react"

export default function AuthForm({ onAuthenticate, isLoading = false }) {
  const [authData, setAuthData] = useState({
    token: "",
    userId: "",
    tenantId: "",
    tenantName: "",
    dealerId: "",
    roleId: ""
  })

  // Try to load from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("tekion-api-token")
      const savedUserId = localStorage.getItem("userId")
      const savedTenantId = localStorage.getItem("tenantId")
      const savedTenantName = localStorage.getItem("tenantName")
      const savedDealerId = localStorage.getItem("dealerId")
      const savedRoleId = localStorage.getItem("roleId")

      if (savedToken || savedUserId || savedTenantId) {
        setAuthData({
          token: savedToken || "",
          userId: savedUserId || "",
          tenantId: savedTenantId || "",
          tenantName: savedTenantName || "",
          dealerId: savedDealerId || "",
          roleId: savedRoleId || ""
        })
      }
    }
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setAuthData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = e => {
    e.preventDefault()

    // Save to localStorage for convenience
    if (typeof window !== "undefined") {
      localStorage.setItem("tekion-api-token", authData.token)
      localStorage.setItem("userId", authData.userId)
      localStorage.setItem("tenantId", authData.tenantId)
      localStorage.setItem("tenantName", authData.tenantName)
      localStorage.setItem("dealerId", authData.dealerId)
      localStorage.setItem("roleId", authData.roleId)
    }

    onAuthenticate(authData)
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Enter Authentication Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700"
            >
              API Token <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="token"
              name="token"
              value={authData.token}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-gray-700"
            >
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={authData.userId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label
              htmlFor="tenantId"
              className="block text-sm font-medium text-gray-700"
            >
              Tenant ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tenantId"
              name="tenantId"
              value={authData.tenantId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label
              htmlFor="tenantName"
              className="block text-sm font-medium text-gray-700"
            >
              Tenant Name
            </label>
            <input
              type="text"
              id="tenantName"
              name="tenantName"
              value={authData.tenantName}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label
              htmlFor="dealerId"
              className="block text-sm font-medium text-gray-700"
            >
              Dealer ID
            </label>
            <input
              type="text"
              id="dealerId"
              name="dealerId"
              value={authData.dealerId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label
              htmlFor="roleId"
              className="block text-sm font-medium text-gray-700"
            >
              Role ID
            </label>
            <input
              type="text"
              id="roleId"
              name="roleId"
              value={authData.roleId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isLoading ? "Processing..." : "Authenticate"}
          </button>
        </div>
      </form>
    </div>
  )
}
