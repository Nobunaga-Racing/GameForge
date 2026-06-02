import { useEffect, useRef, useCallback, useState } from 'react'
import { createWS } from '../lib/api'
import { useAuth } from '../store/auth'

export function useWebSocket() {
  const { token } = useAuth()
  const ws        = useRef(null)
  const handlers  = useRef({})
  const [connected, setConnected] = useState(false)

  const on = useCallback((type, fn) => {
    handlers.current[type] = fn
    return () => { delete handlers.current[type] }
  }, [])

  const send = useCallback((msg) => {
    if (ws.current?.readyState === WebSocket.OPEN)
      ws.current.send(JSON.stringify(msg))
  }, [])

  const subscribe = useCallback((serverId) => {
    send({ type: 'subscribe:server', serverId })
  }, [send])

  useEffect(() => {
    if (!token) return
    let reconnectTimer

    function connect() {
      const socket = createWS(token)
      ws.current = socket

      socket.onopen = () => {
        setConnected(true)
        send({ type: 'subscribe:all' })
      }
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          handlers.current[msg.type]?.(msg)
          handlers.current['*']?.(msg)
        } catch {}
      }
      socket.onclose = () => {
        setConnected(false)
        reconnectTimer = setTimeout(connect, 3000)
      }
      socket.onerror = () => socket.close()
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer)
      ws.current?.close()
    }
  }, [token])

  return { connected, on, send, subscribe }
}
