import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Treasury, Transaction } from '../types/enterprise'

interface FinanceContextType {
  treasury: Treasury
  addTransaction: (t: Transaction) => void
  allocateFunds: (projectId: string, amount: number, description: string) => void
  updateTransaction: (id: string, data: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
}

const initialTreasury: Treasury = {
  totalBalanceSAR: 250000000, // 250M SAR
  allocatedSAR: 15000000,
  availableSAR: 235000000,
  transactions: [
    {
      id: 'tx-001',
      date: '2025-01-01',
      amount: 250000000,
      type: 'deposit',
      description: 'Initial Capital Injection'
    },
    {
      id: 'tx-002',
      date: '2025-01-15',
      amount: 15000000,
      type: 'allocation',
      targetProjectId: 'qiddiya-coastal',
      description: 'Qiddiya Coastal Project Allocation'
    }
  ]
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [treasury, setTreasury] = useState<Treasury>(initialTreasury)

  const addTransaction = (t: Transaction) => {
    setTreasury(prev => {
      let newTotal = prev.totalBalanceSAR
      let newAllocated = prev.allocatedSAR

      if (t.type === 'deposit') newTotal += t.amount
      if (t.type === 'allocation') newAllocated += t.amount
      if (t.type === 'expense') newTotal -= t.amount

      return {
        ...prev,
        totalBalanceSAR: newTotal,
        allocatedSAR: newAllocated,
        availableSAR: newTotal - newAllocated,
        transactions: [t, ...prev.transactions]
      }
    })
  }

  const allocateFunds = (projectId: string, amount: number, description: string) => {
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      type: 'allocation',
      targetProjectId: projectId,
      description
    }
    addTransaction(tx)
  }
  
  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTreasury(prev => {
      const txIndex = prev.transactions.findIndex(t => t.id === id)
      if (txIndex === -1) return prev
      
      const oldTx = prev.transactions[txIndex]
      const newTx = { ...oldTx, ...data }
      
      let newTotal = prev.totalBalanceSAR
      let newAllocated = prev.allocatedSAR
      
      // Revert old
      if (oldTx.type === 'deposit') newTotal -= oldTx.amount
      if (oldTx.type === 'allocation') newAllocated -= oldTx.amount
      if (oldTx.type === 'expense') newTotal += oldTx.amount
      
      // Apply new
      if (newTx.type === 'deposit') newTotal += newTx.amount
      if (newTx.type === 'allocation') newAllocated += newTx.amount
      if (newTx.type === 'expense') newTotal -= newTx.amount
      
      const newTxs = [...prev.transactions]
      newTxs[txIndex] = newTx
      
      return {
        ...prev,
        totalBalanceSAR: newTotal,
        allocatedSAR: newAllocated,
        availableSAR: newTotal - newAllocated,
        transactions: newTxs
      }
    })
  }

  const deleteTransaction = (id: string) => {
    setTreasury(prev => {
      const tx = prev.transactions.find(t => t.id === id)
      if (!tx) return prev
      
      let newTotal = prev.totalBalanceSAR
      let newAllocated = prev.allocatedSAR
      
      if (tx.type === 'deposit') newTotal -= tx.amount
      if (tx.type === 'allocation') newAllocated -= tx.amount
      if (tx.type === 'expense') newTotal += tx.amount
      
      return {
        ...prev,
        totalBalanceSAR: newTotal,
        allocatedSAR: newAllocated,
        availableSAR: newTotal - newAllocated,
        transactions: prev.transactions.filter(t => t.id !== id)
      }
    })
  }

  return (
    <FinanceContext.Provider value={{ treasury, addTransaction, allocateFunds, updateTransaction, deleteTransaction }}>
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => {
  const context = useContext(FinanceContext)
  if (context === undefined) throw new Error('useFinance must be used within FinanceProvider')
  return context
}
