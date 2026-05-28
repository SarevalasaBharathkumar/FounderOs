import { NextRequest, NextResponse } from 'next/server'
const PptxGenJS = require('pptxgenjs')

type PitchSlide = {
  slideNumber?: number
  title?: string
  subtitle?: string
  bullets?: string[]
  stat?: string
  statLabel?: string
  type?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slides: PitchSlide[] = Array.isArray(body?.slides) ? body.slides : []
    const objective: string = typeof body?.objective === 'string' ? body.objective : ''

    const pres = new PptxGenJS()
    pres.layout = 'LAYOUT_16x9'
    pres.title = 'Investor Pitch Deck'
    pres.author = 'FounderOS'

    const BG = '000000'
    const ACCENT = '6366F1'
    const ACCENT2 = '8B5CF6'
    const WHITE = 'FFFFFF'
    const SUBTEXT = 'A1A1AA'
    const MUTED = '52525B'
    const GREEN = '22C55E'
    const AMBER = 'F59E0B'
    const RED = 'EF4444'

    const typeColors: Record<string, string> = {
      cover: ACCENT, problem: RED, solution: GREEN,
      market: AMBER, traction: GREEN, product: ACCENT,
      business: ACCENT2, team: ACCENT, roadmap: ACCENT2, ask: ACCENT,
    }

    slides.forEach((slide: PitchSlide, index: number) => {
      const s = pres.addSlide()
      s.background = { color: BG }
      const accentColor = typeColors[slide.type || ''] || ACCENT

      s.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 0.06,
        fill: { color: accentColor },
        line: { color: accentColor },
      })

      s.addText(`${index + 1}/10`, {
        x: 8.8, y: 5.2, w: 1, h: 0.3,
        fontSize: 9, color: MUTED, fontFace: 'Calibri', margin: 0,
      })

      s.addText('FounderOS', {
        x: 0.3, y: 5.2, w: 2, h: 0.3,
        fontSize: 9, color: MUTED, fontFace: 'Calibri', margin: 0,
      })

      if (slide.type === 'cover') {
        s.addShape(pres.ShapeType.ellipse, {
          x: 2, y: 0.5, w: 6, h: 4.5,
          fill: { color: accentColor, transparency: 92 },
          line: { color: accentColor, transparency: 92 },
        })

        s.addText(slide.title || 'Startup', {
          x: 0.5, y: 1.2, w: 9, h: 1.6,
          fontSize: 54, bold: true, color: WHITE,
          fontFace: 'Calibri', align: 'center', margin: 0, charSpacing: -2,
        })

        s.addText(slide.subtitle || '', {
          x: 0.5, y: 2.9, w: 9, h: 0.6,
          fontSize: 18, color: SUBTEXT,
          fontFace: 'Calibri', align: 'center', margin: 0,
        })

        s.addText(objective ? objective.slice(0, 100) : '', {
          x: 1, y: 3.7, w: 8, h: 0.4,
          fontSize: 11, color: MUTED,
          fontFace: 'Calibri', align: 'center', margin: 0, italic: true,
        })

        s.addShape(pres.ShapeType.rect, {
          x: 3.8, y: 4.4, w: 2.4, h: 0.35,
          fill: { color: accentColor, transparency: 85 },
          line: { color: accentColor },
        })
        s.addText('INVESTOR PITCH DECK', {
          x: 3.8, y: 4.42, w: 2.4, h: 0.3,
          fontSize: 8, bold: true, color: WHITE,
          fontFace: 'Calibri', align: 'center', charSpacing: 2, margin: 0,
        })
      } else if (slide.type === 'ask') {
        s.addText((slide.type || '').toUpperCase(), {
          x: 0.4, y: 0.15, w: 4, h: 0.2,
          fontSize: 9, color: accentColor,
          fontFace: 'Calibri', charSpacing: 3, margin: 0,
        })

        s.addText(slide.title || '', {
          x: 0.4, y: 0.42, w: 9.2, h: 0.8,
          fontSize: 32, bold: true, color: WHITE,
          fontFace: 'Calibri', align: 'center', margin: 0, charSpacing: -1,
        })

        if (slide.stat) {
          s.addShape(pres.ShapeType.rect, {
            x: 3.2, y: 1.4, w: 3.6, h: 1.4,
            fill: { color: accentColor, transparency: 88 },
            line: { color: accentColor },
          })
          s.addText(slide.stat, {
            x: 3.2, y: 1.5, w: 3.6, h: 0.9,
            fontSize: 44, bold: true, color: WHITE,
            fontFace: 'Calibri', align: 'center', margin: 0,
          })
          if (slide.statLabel) {
            s.addText(slide.statLabel, {
              x: 3.2, y: 2.4, w: 3.6, h: 0.3,
              fontSize: 11, color: SUBTEXT,
              fontFace: 'Calibri', align: 'center', margin: 0,
            })
          }
        }

        const bulletItems = Array.isArray(slide.bullets) ? slide.bullets : []
        const bulletY = slide.stat ? 3.0 : 1.5
        const bulletsArr = bulletItems.map((b: string, i: number) => ({
          text: b,
          options: { breakLine: i < bulletItems.length - 1, color: SUBTEXT },
        }))
        if (bulletsArr.length > 0) {
          s.addText(bulletsArr, {
            x: 1, y: bulletY, w: 8, h: 1.8,
            fontSize: 13, fontFace: 'Calibri',
            align: 'center', bullet: false, margin: 0,
            paraSpaceAfter: 8,
          })
        }

        if (slide.subtitle) {
          s.addText(slide.subtitle, {
            x: 0.5, y: 4.85, w: 9, h: 0.3,
            fontSize: 12, color: accentColor,
            fontFace: 'Calibri', align: 'center', italic: true, margin: 0,
          })
        }
      } else {
        s.addText((slide.type || '').toUpperCase(), {
          x: 0.4, y: 0.14, w: 5, h: 0.2,
          fontSize: 9, color: accentColor,
          fontFace: 'Calibri', charSpacing: 3, margin: 0,
        })

        s.addText(slide.title || '', {
          x: 0.4, y: 0.42, w: slide.stat ? 5.8 : 9.2, h: 0.85,
          fontSize: 30, bold: true, color: WHITE,
          fontFace: 'Calibri', margin: 0, charSpacing: -1,
        })

        if (slide.subtitle) {
          s.addText(slide.subtitle, {
            x: 0.4, y: 1.32, w: slide.stat ? 5.8 : 9.2, h: 0.45,
            fontSize: 13, color: SUBTEXT,
            fontFace: 'Calibri', margin: 0,
          })
        }

        if (slide.stat) {
          s.addShape(pres.ShapeType.rect, {
            x: 6.6, y: 1.0, w: 3.0, h: 3.2,
            fill: { color: accentColor, transparency: 88 },
            line: { color: accentColor },
          })
          s.addShape(pres.ShapeType.rect, {
            x: 6.6, y: 1.0, w: 3.0, h: 0.05,
            fill: { color: accentColor },
            line: { color: accentColor },
          })
          s.addText(slide.stat, {
            x: 6.6, y: 1.6, w: 3.0, h: 1.3,
            fontSize: 46, bold: true, color: WHITE,
            fontFace: 'Calibri', align: 'center', margin: 0, charSpacing: -2,
          })
          if (slide.statLabel) {
            s.addText(slide.statLabel, {
              x: 6.6, y: 3.0, w: 3.0, h: 0.6,
              fontSize: 12, color: SUBTEXT,
              fontFace: 'Calibri', align: 'center', margin: 0,
            })
          }
        }

        const bulletItems = Array.isArray(slide.bullets) ? slide.bullets : []
        const bw = slide.stat ? 5.8 : 9.2
        const bulletsData = bulletItems.map((b: string, i: number) => ({
          text: '  ' + b,
          options: {
            breakLine: i < bulletItems.length - 1,
            color: SUBTEXT,
            bullet: { color: accentColor },
          },
        }))
        if (bulletsData.length > 0) {
          s.addText(bulletsData, {
            x: 0.4, y: slide.subtitle ? 1.9 : 1.45,
            w: bw, h: 3.0,
            fontSize: 14, fontFace: 'Calibri',
            margin: 0, paraSpaceAfter: 10,
          })
        }
      }
    })

    const buffer = await pres.write({ outputType: 'arraybuffer' })
    const uint8Array = new Uint8Array(buffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="investor-pitch-deck.pptx"',
        'Content-Length': uint8Array.length.toString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('PPTX generation error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
