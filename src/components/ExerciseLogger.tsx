import { useCallback, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import {
  STARTER_EXERCISES,
  mergeExercises,
  searchExercises,
  toTitleCase,
} from '@/lib/exercise-registry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

export interface ExerciseEntry {
  exercise: string
  kg: number
}

interface ExerciseLoggerProps {
  userExercises: string[]
  onAdd: (entry: ExerciseEntry) => void
}

export function ExerciseLogger({ userExercises, onAdd }: ExerciseLoggerProps) {
  const [open, setOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [kg, setKg] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)

  const allExercises = useMemo(
    () => mergeExercises(STARTER_EXERCISES, userExercises),
    [userExercises],
  )

  const filtered = useMemo(
    () => searchExercises(allExercises, searchQuery),
    [allExercises, searchQuery],
  )

  // Check if the current search query exactly matches an existing exercise
  const queryNormalized = toTitleCase(searchQuery)
  const exactMatchExists =
    searchQuery.trim() !== '' &&
    allExercises.some((e) => e.toLowerCase() === queryNormalized.toLowerCase())

  const handleSelect = useCallback((exercise: string) => {
    setSelectedExercise(exercise)
    setSearchQuery('')
    setOpen(false)
  }, [])

  const handleAddFreeEntry = useCallback(() => {
    const normalized = toTitleCase(searchQuery)
    if (normalized) {
      setSelectedExercise(normalized)
      setSearchQuery('')
      setOpen(false)
    }
  }, [searchQuery])

  const handleSubmit = useCallback(() => {
    const kgNum = parseFloat(kg)
    if (!selectedExercise || isNaN(kgNum) || kgNum < 0) return

    onAdd({
      exercise: selectedExercise,
      kg: kgNum,
    })

    // Reset form
    setSelectedExercise('')
    setKg('')
    setSearchQuery('')

    // Refocus the combobox trigger for quick successive entries
    setTimeout(() => triggerRef.current?.focus(), 0)
  }, [selectedExercise, kg, onAdd])

  const isValid =
    selectedExercise !== '' &&
    kg !== '' &&
    !isNaN(parseFloat(kg)) &&
    parseFloat(kg) >= 0

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Exercise combobox */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Exercise</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              {selectedExercise || 'Select exercise...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            side="bottom"
            align="start"
            avoidCollisions={false}
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search exercises..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty className="p-0" />
                <CommandGroup>
                  {filtered.map((exercise) => (
                    <CommandItem
                      key={exercise}
                      value={exercise}
                      onSelect={() => handleSelect(exercise)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedExercise === exercise
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                      {exercise}
                    </CommandItem>
                  ))}
                  {/* Free entry option when query doesn't match an existing exercise */}
                  {searchQuery.trim() !== '' && !exactMatchExists && (
                    <CommandItem
                      value={`__add__${queryNormalized}`}
                      onSelect={handleAddFreeEntry}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{queryNormalized}"
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Weight input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Weight (kg)</label>
        <Input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          placeholder="0"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
        />
      </div>

      {/* Submit button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!isValid}
        onClick={handleSubmit}
      >
        Add to session
      </Button>
    </div>
  )
}
